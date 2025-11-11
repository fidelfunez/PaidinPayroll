import type { Express } from "express";
import { requireAuth } from "../../auth";
import { storage } from "../../storage";
import { registerPaymentAdminRoutes } from "./payment-admin-routes";

export default function adminRoutes(app: Express) {
  // Register payment admin routes
  registerPaymentAdminRoutes(app);
  // Profile update endpoint
  app.patch('/api/user/profile', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const updates = req.body;
      const updatedUser = await storage.updateUser(user.id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });

  // Role update endpoint
  app.patch('/api/users/:id/role', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user!;
      const userId = parseInt(req.params.id);
      const { role, reason } = req.body;

      // Validate role
      if (!role || !['employee', 'admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      // Get target user
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Authorization checks
      if (currentUser.role === 'employee') {
        return res.status(403).json({ message: 'Employees cannot change user roles' });
      }

      if (currentUser.role === 'admin') {
        // Admins can only promote Employee→Admin or demote Admin→Employee
        if (role === 'super_admin') {
          return res.status(403).json({ message: 'Only Super Admins can create other Super Admins' });
        }
        
        if (targetUser.role === 'super_admin') {
          return res.status(403).json({ message: 'Only Super Admins can demote other Super Admins' });
        }
      }

      // Prevent removing the last Super Admin
      if (targetUser.role === 'super_admin' && role !== 'super_admin') {
        const superAdminCount = await storage.getSuperAdminCount();
        if (superAdminCount <= 1) {
          return res.status(400).json({ 
            message: 'Cannot demote the last Super Admin. At least one Super Admin must remain.' 
          });
        }
      }

      // Update the role
      const updatedUser = await storage.updateUserRole(userId, role, currentUser.id, reason);
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update user role' });
      }

      res.json({
        message: 'User role updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Role update error:', error);
      res.status(500).json({ message: 'Failed to update user role' });
    }
  });

  // Get role changes history
  app.get('/api/users/:id/role-changes', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user!;
      const userId = parseInt(req.params.id);

      // Only Super Admins and Admins can view role change history
      if (currentUser.role === 'employee') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const roleChanges = await storage.getRoleChanges(userId);
      res.json(roleChanges);
    } catch (error) {
      console.error('Get role changes error:', error);
      res.status(500).json({ message: 'Failed to get role changes' });
    }
  });

  // Special endpoint to promote first user to super_admin (one-time setup)
  app.post('/api/admin/promote-first-user', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Verify password matches - use login endpoint logic
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Import password comparison logic
      const { scrypt, timingSafeEqual } = await import('crypto');
      const { promisify } = await import('util');
      const scryptAsync = promisify(scrypt);
      
      // Verify password
      const [hashed, salt] = user.password.split(".");
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = (await scryptAsync(password, salt, 64)) as Buffer;
      const isValid = timingSafeEqual(hashedBuf, suppliedBuf);
      
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid password' });
      }

      // Check if there are already super admins
      const superAdminCount = await storage.getSuperAdminCount();
      
      // Only allow if there are no super admins (first user setup)
      if (superAdminCount > 0) {
        return res.status(403).json({ 
          message: 'Super admin already exists. This endpoint is only for initial setup.' 
        });
      }

      // Promote to super_admin
      const updatedUser = await storage.updateUserRole(user.id, 'super_admin', user.id, 'Initial setup - first user promotion');
      
      res.json({
        message: 'User promoted to super admin successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role
        }
      });
    } catch (error) {
      console.error('Promote first user error:', error);
      res.status(500).json({ message: 'Failed to promote user' });
    }
  });
}
