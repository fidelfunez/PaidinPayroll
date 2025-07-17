import type { Express } from "express";
import { requireAuth } from "../../auth";
import { storage } from "../../storage";

// Bitcoin API utility
async function fetchBtcRate(): Promise<number> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const data = await response.json();
    return data.bitcoin.usd;
  } catch (error) {
    console.error('Failed to fetch BTC rate:', error);
    // Return last known rate or default
    const lastRate = await storage.getLatestBtcRate();
    return lastRate ? parseFloat(lastRate.rate) : 43250;
  }
}

export default function dashboardRoutes(app: Express) {
  // Dashboard endpoints
  app.get('/api/dashboard', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const currentRate = await fetchBtcRate();
      
      // Get dashboard data based on user role
      let dashboardData: any = {
        currentBtcRate: currentRate,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        }
      };

      if (user.role === 'admin') {
        // Admin dashboard data
        const [employees, pendingPayroll, pendingExpenses, invoices] = await Promise.all([
          storage.getEmployees(),
          storage.getPendingPayrollPayments(),
          storage.getPendingExpenseReimbursements(),
          storage.getInvoices(),
        ]);

        dashboardData = {
          ...dashboardData,
          employees: employees.length,
          pendingPayroll: pendingPayroll.length,
          pendingExpenses: pendingExpenses.length,
          totalInvoices: invoices.length,
          recentInvoices: invoices.slice(0, 5),
        };
      } else {
        // Employee dashboard data
        const [payrollPayments, expenseReimbursements] = await Promise.all([
          storage.getPayrollPayments(user.id),
          storage.getExpenseReimbursements(user.id),
        ]);

        dashboardData = {
          ...dashboardData,
          payrollPayments: payrollPayments.slice(0, 5),
          expenseReimbursements: expenseReimbursements.slice(0, 5),
        };
      }

      res.json(dashboardData);
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
  });
} 