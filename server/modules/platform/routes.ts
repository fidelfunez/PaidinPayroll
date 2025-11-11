import type { Express } from "express";
import { requireAuth } from "../../auth";
import { storage } from "../../storage";
import { db } from "../../db";
import { users, companies, payrollPayments, expenseReimbursements } from "@shared/schema";
import { eq, sql, desc, count } from "drizzle-orm";

export default function platformRoutes(app: Express) {
  // Middleware to require platform admin role
  const requirePlatformAdmin = (req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== 'platform_admin') {
      return res.status(403).json({ 
        message: 'You need platform administrator privileges to access this resource.' 
      });
    }
    next();
  };

  // Platform overview dashboard
  app.get('/api/platform/overview', requireAuth, requirePlatformAdmin, async (req, res) => {
    try {
      // Get total companies
      const [totalCompaniesResult] = await db
        .select({ count: count() })
        .from(companies)
        .where(eq(companies.slug, 'platform'));

      const totalCompanies = await db
        .select({ count: count() })
        .from(companies)
        .where(sql`slug != 'platform'`);

      // Get active subscriptions
      const activeSubscriptions = await db
        .select({ count: count() })
        .from(companies)
        .where(sql`subscription_status = 'active' AND slug != 'platform'`);

      // Get total employees across all companies
      const totalEmployees = await db
        .select({ count: count() })
        .from(users)
        .where(sql`company_id != (SELECT id FROM companies WHERE slug = 'platform')`);

      // Get subscription breakdown
      const subscriptionBreakdown = await db
        .select({
          plan: companies.subscriptionPlan,
          count: count()
        })
        .from(companies)
        .where(sql`slug != 'platform'`)
        .groupBy(companies.subscriptionPlan);

      // Get monthly revenue
      const monthlyRevenue = await db
        .select({
          total: sql<number>`SUM(monthly_fee)`
        })
        .from(companies)
        .where(sql`subscription_status = 'active' AND slug != 'platform'`);

      // Get new companies this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const newCompaniesThisMonth = await db
        .select({ count: count() })
        .from(companies)
        .where(sql`created_at >= ${thisMonth.getTime()} AND slug != 'platform'`);

      res.json({
        totalCompanies: totalCompanies[0]?.count || 0,
        activeSubscriptions: activeSubscriptions[0]?.count || 0,
        totalEmployees: totalEmployees[0]?.count || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        newCompaniesThisMonth: newCompaniesThisMonth[0]?.count || 0,
        subscriptionBreakdown: subscriptionBreakdown.reduce((acc, item) => {
          acc[item.plan] = item.count;
          return acc;
        }, {} as Record<string, number>)
      });
    } catch (error) {
      console.error('Platform overview error:', error);
      res.status(500).json({ message: 'Failed to get platform overview' });
    }
  });

  // Get all companies
  app.get('/api/platform/companies', requireAuth, requirePlatformAdmin, async (req, res) => {
    try {
      const companiesList = await db
        .select()
        .from(companies)
        .where(sql`slug != 'platform'`)
        .orderBy(desc(companies.createdAt));

      // Get employee counts for each company
      const companiesWithStats = await Promise.all(
        companiesList.map(async (company) => {
          const [employeeCount] = await db
            .select({ count: count() })
            .from(users)
            .where(eq(users.companyId, company.id));

          const [superAdminCount] = await db
            .select({ count: count() })
            .from(users)
            .where(sql`company_id = ${company.id} AND role = 'super_admin'`);

          const [adminCount] = await db
            .select({ count: count() })
            .from(users)
            .where(sql`company_id = ${company.id} AND role = 'admin'`);

          const [employeeCountOnly] = await db
            .select({ count: count() })
            .from(users)
            .where(sql`company_id = ${company.id} AND role = 'employee'`);

          return {
            ...company,
            employeeCount: employeeCount.count,
            staffBreakdown: {
              superAdmins: superAdminCount.count,
              admins: adminCount.count,
              employees: employeeCountOnly.count
            }
          };
        })
      );

      res.json(companiesWithStats);
    } catch (error) {
      console.error('Get companies error:', error);
      res.status(500).json({ message: 'Failed to get companies' });
    }
  });

  // Get company details
  app.get('/api/platform/companies/:id', requireAuth, requirePlatformAdmin, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId));

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // Get all users for this company
      const companyUsers = await db
        .select()
        .from(users)
        .where(eq(users.companyId, companyId))
        .orderBy(users.firstName, users.lastName);

      // Get recent activity (payroll payments)
      const recentPayroll = await db
        .select()
        .from(payrollPayments)
        .where(eq(payrollPayments.companyId, companyId))
        .orderBy(desc(payrollPayments.createdAt))
        .limit(10);

      // Get recent expenses
      const recentExpenses = await db
        .select()
        .from(expenseReimbursements)
        .where(eq(expenseReimbursements.companyId, companyId))
        .orderBy(desc(expenseReimbursements.createdAt))
        .limit(10);

      res.json({
        company,
        users: companyUsers,
        recentActivity: {
          payroll: recentPayroll,
          expenses: recentExpenses
        }
      });
    } catch (error) {
      console.error('Get company details error:', error);
      res.status(500).json({ message: 'Failed to get company details' });
    }
  });

  // Get all staff across all companies
  app.get('/api/platform/staff', requireAuth, requirePlatformAdmin, async (req, res) => {
    try {
      const allStaff = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          username: users.username,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          companyName: companies.name,
          companySlug: companies.slug
        })
        .from(users)
        .innerJoin(companies, eq(users.companyId, companies.id))
        .where(sql`companies.slug != 'platform'`)
        .orderBy(desc(users.createdAt));

      res.json(allStaff);
    } catch (error) {
      console.error('Get all staff error:', error);
      res.status(500).json({ message: 'Failed to get staff' });
    }
  });

  // Update company subscription
  app.patch('/api/platform/companies/:id/subscription', requireAuth, requirePlatformAdmin, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const { subscriptionPlan, subscriptionStatus, subscriptionEndDate, monthlyFee } = req.body;

      // Update company subscription
      const [updatedCompany] = await db
        .update(companies)
        .set({
          subscriptionPlan,
          subscriptionStatus,
          subscriptionEndDate: subscriptionEndDate ? new Date(subscriptionEndDate) : undefined,
          monthlyFee,
          updatedAt: new Date()
        })
        .where(eq(companies.id, companyId))
        .returning();

      if (!updatedCompany) {
        return res.status(404).json({ message: 'Company not found' });
      }

      res.json({
        message: 'Company subscription updated successfully',
        company: updatedCompany
      });
    } catch (error) {
      console.error('Update subscription error:', error);
      res.status(500).json({ message: 'Failed to update subscription' });
    }
  });

  // Get platform analytics
  app.get('/api/platform/analytics', requireAuth, requirePlatformAdmin, async (req, res) => {
    try {
      // Get monthly growth data
      const monthlyGrowth = await db
        .select({
          month: sql<string>`strftime('%Y-%m', datetime(created_at/1000, 'unixepoch'))`,
          count: count()
        })
        .from(companies)
        .where(sql`slug != 'platform'`)
        .groupBy(sql`strftime('%Y-%m', datetime(created_at/1000, 'unixepoch'))`)
        .orderBy(sql`strftime('%Y-%m', datetime(created_at/1000, 'unixepoch'))`);

      // Get role distribution
      const roleDistribution = await db
        .select({
          role: users.role,
          count: count()
        })
        .from(users)
        .innerJoin(companies, eq(users.companyId, companies.id))
        .where(sql`companies.slug != 'platform'`)
        .groupBy(users.role);

      // Get subscription status distribution
      const subscriptionStatus = await db
        .select({
          status: companies.subscriptionStatus,
          count: count()
        })
        .from(companies)
        .where(sql`slug != 'platform'`)
        .groupBy(companies.subscriptionStatus);

      res.json({
        monthlyGrowth,
        roleDistribution,
        subscriptionStatus
      });
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ message: 'Failed to get analytics' });
    }
  });
}
