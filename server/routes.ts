import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireAdmin } from "./auth";
import { z } from "zod";
import { 
  insertPayrollPaymentSchema, 
  insertExpenseReimbursementSchema,
  insertBtcRateHistorySchema,
  insertBtcpayInvoiceSchema,
  insertConversationSchema,
  insertMessageSchema
} from "@shared/schema";
// WebSocket imports temporarily disabled
// import { initializeMessagingWebSocket, messagingWS } from "./websocket";
import { btcpayService } from "./btcpay";

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

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

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

  // Get employees with withdrawal methods for payroll
  app.get('/api/employees/withdrawal-methods', requireAdmin, async (req, res) => {
    try {
      const employees = await storage.getEmployeesWithWithdrawalMethods();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch employee withdrawal methods' });
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
        amountBtc: amountBtc, // number, not string
        btcRate: currentRate, // number, not string
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
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid payment ID' });
      }
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

  // Expense Reimbursement endpoints
  app.get('/api/expense-reimbursements', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const userId = user.role === 'admin' ? undefined : user.id;
      const reimbursements = await storage.getExpenseReimbursements(userId);
      res.json(reimbursements);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch expense reimbursements' });
    }
  });

  app.post('/api/expense-reimbursements', requireAuth, async (req, res) => {
    try {
      const validation = insertExpenseReimbursementSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid expense reimbursement data', errors: validation.error.errors });
      }
      const currentRate = await fetchBtcRate();
      const amountUsd = parseFloat(validation.data.amountUsd);
      const amountBtc = amountUsd / currentRate;
      const reimbursementData = {
        ...validation.data,
        amountBtc: amountBtc, // number, not string
        btcRate: currentRate, // number, not string
      };
      const reimbursement = await storage.createExpenseReimbursement(reimbursementData);
      res.status(201).json(reimbursement);
    } catch (error) {
      console.error('Expense reimbursement creation error:', error);
      res.status(500).json({ message: 'Failed to create expense reimbursement' });
    }
  });

  app.patch('/api/expense-reimbursements/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      // If updating status to completed, add transaction details
      if (updates.status === 'completed') {
        updates.paidDate = new Date();
        updates.transactionHash = `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      const reimbursement = await storage.updateExpenseReimbursement(id, updates);
      if (!reimbursement) {
        return res.status(404).json({ message: 'Reimbursement not found' });
      }
      res.json(reimbursement);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update reimbursement' });
    }
  });

  // BtcRateHistory endpoints
  app.get('/api/btc-rate-history', requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const history = await storage.getBtcRateHistory(start, end);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch BTC rate history' });
    }
  });

  // BtcpayInvoice endpoints
  app.get('/api/btcpay/invoices', requireAuth, async (req, res) => {
    try {
      // Use storage to get all BTCPay invoices
      const invoices = await storage.getBtcpayInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch BTCPay invoices' });
    }
  });

  app.post('/api/btcpay/invoices', requireAuth, async (req, res) => {
    try {
      // Ensure required 'amount' property is passed
      const { amount, currency, description, orderId, customerEmail, customerName, redirectUrl, webhookUrl } = req.body;
      const invoice = await btcpayService.createInvoice({
        amount: parseFloat(amount),
        currency: currency || 'USD',
        description,
        orderId,
        customerEmail,
        customerName,
        redirectUrl,
        webhookUrl
      });
      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create BTCPay invoice' });
    }
  });

  app.get('/api/btcpay/invoices/:id', requireAuth, async (req, res) => {
    try {
      const invoiceId = req.params.id.toString();
      const invoice = await btcpayService.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch BTCPay invoice' });
    }
  });

  app.patch('/api/btcpay/invoices/:id', requireAuth, async (req, res) => {
    try {
      const invoiceId = req.params.id.toString();
      // Comment out or remove updateInvoice if it doesn't exist
      // const invoice = await btcpayService.updateInvoice(invoiceId, updates);
      // if (!invoice) {
      //   return res.status(404).json({ message: 'Invoice not found' });
      // }
      // res.json(invoice);
      res.status(501).json({ message: 'Not implemented' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update BTCPay invoice' });
    }
  });

  app.delete('/api/btcpay/invoices/:id', requireAuth, async (req, res) => {
    try {
      const invoiceId = req.params.id.toString();
      await btcpayService.markInvoiceInvalid(invoiceId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete BTCPay invoice' });
    }
  });

  // LNbits endpoints - REMOVED (integration on hold)
  // app.get('/api/lnbits/wallets', requireAuth, async (req, res) => {
  //   try {
  //     // No getWallets method in LNbitsService
  //     // const wallets = await lnbitsService.getWallets();
  //     res.status(501).json({ message: 'Not implemented' });
  //   } catch (error) {
  //     res.status(500).json({ message: 'Failed to fetch LNbits wallets' });
  //   }
  // });

  // app.get('/api/lnbits/invoices', requireAuth, async (req, res) => {
  //   try {
  //     // No getInvoices method in LNbitsService
  //     // const invoices = await lnbitsService.getInvoices();
  //     res.status(501).json({ message: 'Not implemented' });
  //   } catch (error) {
  //     res.status(500).json({ message: 'Failed to fetch LNbits invoices' });
  //   }
  // });

  // app.post('/api/lnbits/invoices', requireAuth, async (req, res) => {
  //   try {
  //     // Use createInvoice(amount, memo, description)
  //     const { amount, memo, description } = req.body;
  //     const invoice = await lnbitsService.createInvoice(amount, memo, description);
  //     res.status(201).json(invoice);
  //   } catch (error) {
  //     console.error('LNbits invoice creation error:', error);
  //     res.status(500).json({ message: 'Failed to create LNbits invoice' });
  //   }
  // });

  // app.get('/api/lnbits/invoices/:id', requireAuth, async (req, res) => {
  //   try {
  //     // Use getPaymentStatus(checkingId)
  //     const checkingId = req.params.id;
  //     const status = await lnbitsService.getPaymentStatus(checkingId);
  //     res.json(status);
  //   } catch (error) {
  //     res.status(500).json({ message: 'Failed to fetch LNbits invoice status' });
  //   }
  // });

  // app.patch('/api/lnbits/invoices/:id', requireAuth, async (req, res) => {
  //   try {
  //     // No updateInvoice method in LNbitsService
  //     res.status(501).json({ message: 'Not implemented' });
  //   } catch (error) {
  //     res.status(500).json({ message: 'Failed to update LNbits invoice' });
  //   }
  // });

  // app.delete('/api/lnbits/invoices/:id', requireAuth, async (req, res) => {
  //   try {
  //     // No deleteInvoice method in LNbitsService
  //     res.status(501).json({ message: 'Not implemented' });
  //   } catch (error) {
  //     res.status(500).json({ message: 'Failed to delete LNbits invoice' });
  //   }
  // });

  // Conversation and Message endpoints
  app.get('/api/conversations', requireAuth, async (req, res) => {
    try {
      const conversations = await storage.getUserConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  app.post('/api/conversations', requireAuth, async (req, res) => {
    try {
      const validation = insertConversationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid conversation data', errors: validation.error.errors });
      }
      const conversation = await storage.createConversation(validation.data);
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Conversation creation error:', error);
      res.status(500).json({ message: 'Failed to create conversation' });
    }
  });

  app.get('/api/conversations/:id', requireAuth, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch conversation' });
    }
  });

  app.post('/api/conversations/:id/messages', requireAuth, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const validation = insertMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid message data', errors: validation.error.errors });
      }
      const message = await storage.createMessage({ ...validation.data, conversationId });
      res.status(201).json(message);
    } catch (error) {
      console.error('Message creation error:', error);
      res.status(500).json({ message: 'Failed to create message' });
    }
  });

  app.get('/api/conversations/:id/messages', requireAuth, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getConversationMessages(conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  // WebSocket initialization is temporarily disabled due to configuration issues
  // initializeMessagingWebSocket(messagingWS);

  // Return the HTTP server (if needed)
  return createServer(app);
}
