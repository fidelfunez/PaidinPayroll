import type { Express } from "express";
import { Router } from "express";
import { db } from "../../db";
import { users, companies } from "../../../shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../../auth";

const router = Router();

// Middleware to require platform admin access
// Only platform_admin role can access the admin console
// Regular 'admin' role users are company admins, not platform admins
function requireAdminAccess(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Please log in to access this page.' 
    });
  }
  
  // Only platform_admin can access the admin console
  // Regular 'admin' role is for company admins only
  if (req.user.role !== 'platform_admin') {
    return res.status(403).json({ 
      message: 'You need platform administrator privileges to access this page.' 
    });
  }
  
  next();
}

// GET /api/admin/users - List all users
router.get('/users', requireAuth, requireAdminAccess, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;

    let query = db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        companyId: users.companyId,
        companyName: companies.name,
        companySlug: companies.slug,
      })
      .from(users)
      .leftJoin(companies, eq(users.companyId, companies.id))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // If search provided, filter by username, email, or company name
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      query = db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt,
          companyId: users.companyId,
          companyName: companies.name,
          companySlug: companies.slug,
        })
        .from(users)
        .leftJoin(companies, eq(users.companyId, companies.id))
        .where(
          sql`(
            LOWER(${users.username}) LIKE ${searchLower} OR
            LOWER(${users.email}) LIKE ${searchLower} OR
            LOWER(${users.firstName}) LIKE ${searchLower} OR
            LOWER(${users.lastName}) LIKE ${searchLower} OR
            LOWER(${companies.name}) LIKE ${searchLower}
          )`
        )
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);
    }

    const allUsers = await query;

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const total = totalResult[0]?.count || 0;

    res.json({
      users: allUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      message: 'Failed to fetch users',
      error: error.message 
    });
  }
});

// GET /api/admin/users/:id - Get user details
router.get('/users/:id', requireAuth, requireAdminAccess, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        companyId: users.companyId,
        companyName: companies.name,
        companySlug: companies.slug,
      })
      .from(users)
      .leftJoin(companies, eq(users.companyId, companies.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user',
      error: error.message 
    });
  }
});

// POST /api/admin/users/:id/block - Block/suspend a user
router.post('/users/:id/block', requireAuth, requireAdminAccess, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Don't allow blocking yourself
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot block your own account' });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user to inactive
    await db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, userId));

    console.log(`User ${user.username} (ID: ${userId}) blocked by admin ${req.user.username}`);

    res.json({ 
      message: 'User blocked successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: false,
      }
    });
  } catch (error: any) {
    console.error('Error blocking user:', error);
    res.status(500).json({ 
      message: 'Failed to block user',
      error: error.message 
    });
  }
});

// POST /api/admin/users/:id/unblock - Unblock a user
router.post('/users/:id/unblock', requireAuth, requireAdminAccess, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user to active
    await db
      .update(users)
      .set({ isActive: true })
      .where(eq(users.id, userId));

    console.log(`User ${user.username} (ID: ${userId}) unblocked by admin ${req.user.username}`);

    res.json({ 
      message: 'User unblocked successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: true,
      }
    });
  } catch (error: any) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ 
      message: 'Failed to unblock user',
      error: error.message 
    });
  }
});

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', requireAuth, requireAdminAccess, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Don't allow deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user (cascade will handle related data if foreign keys are set up)
    await db
      .delete(users)
      .where(eq(users.id, userId));

    console.log(`User ${user.username} (ID: ${userId}) deleted by admin ${req.user.username}`);

    res.json({ 
      message: 'User deleted successfully',
      deletedUser: {
        id: user.id,
        username: user.username,
        email: user.email,
      }
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      message: 'Failed to delete user',
      error: error.message 
    });
  }
});

// GET /api/admin/stats - Get admin dashboard stats
router.get('/stats', requireAuth, requireAdminAccess, async (req, res) => {
  try {
    const totalUsers = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    
    const activeUsers = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isActive, true));
    
    const verifiedUsers = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.emailVerified, true));
    
    const totalCompanies = await db
      .select({ count: sql<number>`count(*)` })
      .from(companies);

    // Get signups in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSignups = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= ${sevenDaysAgo.getTime()}`);

    res.json({
      stats: {
        totalUsers: totalUsers[0]?.count || 0,
        activeUsers: activeUsers[0]?.count || 0,
        verifiedUsers: verifiedUsers[0]?.count || 0,
        totalCompanies: totalCompanies[0]?.count || 0,
        recentSignups: recentSignups[0]?.count || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch stats',
      error: error.message 
    });
  }
});

export default router;
