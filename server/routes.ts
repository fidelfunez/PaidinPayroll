import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertPayrollPaymentSchema, 
  insertExpenseReimbursementSchema,
  insertBtcRateHistorySchema
} from "@shared/schema";

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
    return lastRate ? parseFloat(lastRate.rate) : 43250; // Fallback rate
  }
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || !req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // BTC rate endpoints
  app.get('/api/btc-rate', requireAuth, async (req, res) => {
    try {
      const currentRate = await fetchBtcRate();
      
      // Save rate to history
      await storage.saveBtcRate({
        rate: currentRate.toString(),
        source: 'coingecko'
      });

      res.json({ rate: currentRate });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch BTC rate' });
    }
  });

  app.get('/api/btc-rate/history', requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const history = await storage.getBtcRateHistory(start, end);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch rate history' });
    }
  });

  // Dashboard endpoints
  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      const user = req.user!; // TypeScript assertion - user is guaranteed to exist after requireAuth
      const userId = user.role === 'admin' ? undefined : user.id;
      
      const [payrollPayments, expenseReimbursements, employees, currentRate] = await Promise.all([
        storage.getPayrollPayments(userId),
        storage.getExpenseReimbursements(userId),
        user.role === 'admin' ? storage.getEmployees() : [],
        fetchBtcRate()
      ]);

      const pendingPayments = payrollPayments.filter(p => p.status === 'pending');
      const pendingExpenses = expenseReimbursements.filter(e => e.status === 'pending');

      // Calculate totals
      const totalBtcBalance = payrollPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amountBtc), 0);

      const monthlyPayrollUsd = payrollPayments
        .filter(p => {
          const paymentDate = new Date(p.createdAt);
          const now = new Date();
          return paymentDate.getMonth() === now.getMonth() && 
                 paymentDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, p) => sum + parseFloat(p.amountUsd), 0);

      res.json({
        totalBtcBalance,
        totalBtcBalanceUsd: totalBtcBalance * currentRate,
        pendingPaymentsCount: pendingPayments.length,
        pendingPaymentsAmount: pendingPayments.reduce((sum, p) => sum + parseFloat(p.amountUsd), 0),
        monthlyPayrollUsd,
        activeEmployees: employees.length,
        currentBtcRate: currentRate,
        recentActivity: [
          ...payrollPayments.slice(0, 5).map(p => ({
            type: 'payroll',
            description: `Salary payment`,
            amount: p.amountUsd,
            date: p.createdAt,
            status: p.status
          })),
          ...expenseReimbursements.slice(0, 5).map(e => ({
            type: 'expense',
            description: e.description,
            amount: e.amountUsd,
            date: e.createdAt,
            status: e.status
          }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  // Employee endpoints
  app.get('/api/employees', requireAdmin, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch employees' });
    }
  });

  // Payroll endpoints
  app.get('/api/payroll', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const userId = user.role === 'admin' ? undefined : user.id;
      const payments = await storage.getPayrollPayments(userId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch payroll payments' });
    }
  });

  app.post('/api/payroll', requireAdmin, async (req, res) => {
    try {
      const validation = insertPayrollPaymentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid payroll data', errors: validation.error.errors });
      }

      const currentRate = await fetchBtcRate();
      const amountUsd = parseFloat(validation.data.amountUsd);
      const amountBtc = amountUsd / currentRate;

      const paymentData = {
        ...validation.data,
        amountBtc: amountBtc.toString(),
        btcRate: currentRate.toString()
      };

      const payment = await storage.createPayrollPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      console.error('Payroll creation error:', error);
      res.status(500).json({ message: 'Failed to create payroll payment' });
    }
  });

  app.patch('/api/payroll/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      // If updating status to completed, add transaction details
      if (updates.status === 'completed') {
        updates.paidDate = new Date();
        updates.transactionHash = `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      const payment = await storage.updatePayrollPayment(id, updates);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update payment' });
    }
  });

  // Expense endpoints
  app.get('/api/expenses', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const userId = user.role === 'admin' ? undefined : user.id;
      const expenses = await storage.getExpenseReimbursements(userId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch expenses' });
    }
  });

  app.post('/api/expenses', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const validation = insertExpenseReimbursementSchema.safeParse({
        ...req.body,
        userId: user.id
      });
      
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid expense data', errors: validation.error.errors });
      }

      const expense = await storage.createExpenseReimbursement(validation.data);
      res.status(201).json(expense);
    } catch (error) {
      console.error('Expense creation error:', error);
      res.status(500).json({ message: 'Failed to create expense' });
    }
  });

  app.patch('/api/expenses/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const id = parseInt(req.params.id);
      const updates = req.body;

      // If approving expense, calculate BTC amount
      if (updates.status === 'approved' && user.role === 'admin') {
        const currentRate = await fetchBtcRate();
        const expense = await storage.getExpenseReimbursements();
        const targetExpense = expense.find(e => e.id === id);
        
        if (targetExpense) {
          const amountUsd = parseFloat(targetExpense.amountUsd);
          const amountBtc = amountUsd / currentRate;
          
          updates.amountBtc = amountBtc.toString();
          updates.btcRate = currentRate.toString();
          updates.approvedBy = user.id;
          updates.approvedDate = new Date();
        }
      }

      // If marking as paid
      if (updates.status === 'paid' && user.role === 'admin') {
        updates.paidDate = new Date();
        updates.transactionHash = `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      const expense = await storage.updateExpenseReimbursement(id, updates);
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update expense' });
    }
  });

  // Reports endpoints
  app.get('/api/reports/payroll', requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      let payments = await storage.getPayrollPayments();

      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        payments = payments.filter(p => {
          const paymentDate = new Date(p.createdAt);
          return paymentDate >= start && paymentDate <= end;
        });
      }

      // Generate CSV data
      const csvData = payments.map(p => ({
        id: p.id,
        userId: p.userId,
        amountUsd: p.amountUsd,
        amountBtc: p.amountBtc,
        btcRate: p.btcRate,
        status: p.status,
        scheduledDate: p.scheduledDate,
        paidDate: p.paidDate,
        transactionHash: p.transactionHash,
        createdAt: p.createdAt
      }));

      res.json(csvData);
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate payroll report' });
    }
  });

  app.get('/api/reports/expenses', requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      let expenses = await storage.getExpenseReimbursements();

      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        expenses = expenses.filter(e => {
          const expenseDate = new Date(e.createdAt);
          return expenseDate >= start && expenseDate <= end;
        });
      }

      // Generate CSV data
      const csvData = expenses.map(e => ({
        id: e.id,
        userId: e.userId,
        description: e.description,
        category: e.category,
        amountUsd: e.amountUsd,
        amountBtc: e.amountBtc,
        btcRate: e.btcRate,
        status: e.status,
        approvedBy: e.approvedBy,
        approvedDate: e.approvedDate,
        paidDate: e.paidDate,
        transactionHash: e.transactionHash,
        createdAt: e.createdAt
      }));

      res.json(csvData);
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate expense report' });
    }
  });

  // Time tracking endpoints
  app.get('/api/time-tracking', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const userId = user.role === 'admin' ? undefined : user.id;
      const timeEntries = await storage.getTimeTracking(userId);
      res.json(timeEntries);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch time tracking data' });
    }
  });

  app.post('/api/time-tracking/clock-in', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const timeEntry = await storage.createTimeTracking({
        userId: user.id,
        clockIn: new Date(),
        description: req.body.description || ''
      });
      res.status(201).json(timeEntry);
    } catch (error) {
      res.status(500).json({ message: 'Failed to clock in' });
    }
  });

  app.post('/api/time-tracking/:id/clock-out', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const timeEntry = await storage.clockOut(id);
      if (!timeEntry) {
        return res.status(404).json({ message: 'Time entry not found' });
      }
      res.json(timeEntry);
    } catch (error) {
      res.status(500).json({ message: 'Failed to clock out' });
    }
  });

  // Time off endpoints
  app.get('/api/time-off', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const userId = user.role === 'admin' ? undefined : user.id;
      const requests = await storage.getTimeOffRequests(userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch time off requests' });
    }
  });

  app.post('/api/time-off', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const request = await storage.createTimeOffRequest({
        ...req.body,
        userId: user.id
      });
      res.status(201).json(request);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create time off request' });
    }
  });

  // Notification endpoints
  app.get('/api/notifications', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const notifications = await storage.getNotifications(user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.patch('/api/notifications/:id/read', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(id);
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  // Admin-specific endpoints
  app.get('/api/admin/expenses', requireAdmin, async (req, res) => {
    try {
      const expenses = await storage.getExpenseReimbursements();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch all expenses' });
    }
  });

  app.get('/api/admin/payroll', requireAdmin, async (req, res) => {
    try {
      const payments = await storage.getPayrollPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch all payroll' });
    }
  });

  app.get('/api/admin/time-off', requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getTimeOffRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch time off requests' });
    }
  });

  app.patch('/api/admin/time-off/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (updates.status === 'approved') {
        updates.approvedBy = req.user!.id;
        updates.approvedDate = new Date();
      }

      const request = await storage.updateTimeOffRequest(id, updates);
      if (!request) {
        return res.status(404).json({ message: 'Time off request not found' });
      }

      res.json(request);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update time off request' });
    }
  });

  app.get('/api/admin/audit-logs', requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  // Tax document endpoints
  app.get('/api/tax-documents', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const userId = user.role === 'admin' ? undefined : user.id;
      const documents = await storage.getTaxDocuments(userId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tax documents' });
    }
  });

  app.post('/api/tax-documents', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const document = await storage.createTaxDocument({
        ...req.body,
        userId: user.id
      });
      res.status(201).json(document);
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload tax document' });
    }
  });

  // Profile photo upload endpoint
  app.patch('/api/user/profile-photo', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const { profilePhoto } = req.body;

      // Validate base64 image data (limit to 2MB)
      if (profilePhoto && profilePhoto.length > 2 * 1024 * 1024 * 1.37) { // Base64 is ~37% larger
        return res.status(400).json({ message: 'Image too large (max 2MB)' });
      }

      // Validate base64 format
      if (profilePhoto && !profilePhoto.match(/^data:image\/(jpeg|jpg|png|webp);base64,/)) {
        return res.status(400).json({ message: 'Invalid image format' });
      }

      const updatedUser = await storage.updateUser(user.id, { profilePhoto });
      res.json(updatedUser);
    } catch (error) {
      console.error('Profile photo update error:', error);
      res.status(500).json({ message: 'Failed to update profile photo' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
