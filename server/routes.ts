import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertPayrollPaymentSchema, 
  insertExpenseReimbursementSchema,
  insertBtcRateHistorySchema,
  insertBtcpayInvoiceSchema,
  insertConversationSchema,
  insertMessageSchema
} from "@shared/schema";
import { initializeMessagingWebSocket, messagingWS } from "./websocket";
import { lnbitsService } from "./lnbits";
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

  // Process Bitcoin payment via LNbits
  app.post('/api/payroll/:id/process-bitcoin', requireAdmin, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      
      // Get payment details
      const payments = await storage.getPayrollPayments();
      const payment = payments.find(p => p.id === paymentId);
      
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      if (payment.status !== 'pending') {
        return res.status(400).json({ message: 'Payment is not in pending status' });
      }

      // Get employee details
      const employee = await storage.getUser(payment.userId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      if (!employee.btcAddress) {
        return res.status(400).json({ 
          message: 'Employee has not set up Bitcoin withdrawal method' 
        });
      }

      // Convert amount to satoshis
      const currentBtcRate = await fetchBtcRate();
      const amountUsd = parseFloat(payment.amountUsd);
      const amountSats = lnbitsService.usdToSatoshis(amountUsd, currentBtcRate);

      let lnbitsResult;
      let processingNotes = '';

      try {
        // Check if it's a Lightning address or Bitcoin address
        if (lnbitsService.isValidLightningAddress(employee.btcAddress)) {
          // Pay to Lightning address
          const memo = `Salary payment for ${employee.firstName} ${employee.lastName} - $${amountUsd}`;
          lnbitsResult = await lnbitsService.payToLightningAddress(
            employee.btcAddress,
            amountSats,
            memo
          );
          processingNotes = `Lightning payment sent to ${employee.btcAddress}`;
        } else if (lnbitsService.isValidBitcoinAddress(employee.btcAddress)) {
          // Handle Bitcoin address payment
          return res.status(400).json({ 
            message: 'On-chain Bitcoin payments not yet supported. Please ask employee to provide Lightning address.' 
          });
        } else {
          return res.status(400).json({ 
            message: 'Invalid Bitcoin address or Lightning address format' 
          });
        }

        // Update payment with LNbits details
        const updatedPayment = await storage.updatePayrollPayment(paymentId, {
          status: 'processing',
          lnbitsPaymentHash: lnbitsResult.payment_hash,
          lnbitsInvoiceId: lnbitsResult.checking_id,
          processingNotes: processingNotes
        });

        res.json({
          success: true,
          payment: updatedPayment,
          lnbitsPaymentHash: lnbitsResult.payment_hash
        });

      } catch (lnbitsError: any) {
        // Update payment with error details
        await storage.updatePayrollPayment(paymentId, {
          status: 'failed',
          processingNotes: `Payment failed: ${lnbitsError.message}`
        });

        res.status(400).json({ 
          message: `Bitcoin payment failed: ${lnbitsError.message}` 
        });
      }

    } catch (error) {
      console.error('Bitcoin payment error:', error);
      res.status(500).json({ message: 'Failed to process Bitcoin payment' });
    }
  });

  // Check LNbits payment status
  app.get('/api/payroll/:id/bitcoin-status', requireAdmin, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      
      const payments = await storage.getPayrollPayments();
      const payment = payments.find(p => p.id === paymentId);
      
      if (!payment || !payment.lnbitsInvoiceId) {
        return res.status(404).json({ message: 'Payment or LNbits transaction not found' });
      }

      const status = await lnbitsService.getPaymentStatus(payment.lnbitsInvoiceId);
      
      // Update payment status if completed
      if (status.paid && payment.status === 'processing') {
        await storage.updatePayrollPayment(paymentId, {
          status: 'completed',
          paidDate: new Date(),
          transactionHash: payment.lnbitsPaymentHash,
          processingNotes: `Lightning payment completed. Fee: ${status.fee} sats`
        });
      }

      res.json({
        paid: status.paid,
        amount: status.amount,
        fee: status.fee,
        time: status.time
      });

    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({ message: 'Failed to check payment status' });
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

  // Messaging API routes
  app.get('/api/conversations', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const conversations = await storage.getUserConversations(user.id);
      
      // Get conversation details with participants and last message
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conv) => {
          const participants = await Promise.all(
            conv.participantIds.map(id => storage.getUser(id))
          );
          
          const lastMessage = conv.lastMessageId 
            ? await storage.getConversationMessages(conv.id, 1, 0)
            : [];
          
          const unreadCount = await getUnreadCount(conv.id, user.id);
          
          return {
            ...conv,
            participants: participants.filter(p => p !== undefined),
            lastMessage: lastMessage[0] || null,
            unreadCount
          };
        })
      );
      
      res.json(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  app.post('/api/conversations', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const { participantIds } = req.body;
      
      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({ message: 'Participant IDs are required' });
      }
      
      // Include current user in participants
      const allParticipants = Array.from(new Set([user.id, ...participantIds]));
      
      // Check if conversation already exists
      const existingConversations = await storage.getUserConversations(user.id);
      const existingConv = existingConversations.find(conv => 
        conv.participantIds.length === allParticipants.length &&
        allParticipants.every(id => conv.participantIds.includes(id))
      );
      
      if (existingConv) {
        return res.json(existingConv);
      }
      
      const conversation = await storage.createConversation({
        participantIds: allParticipants
      });
      
      res.json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ message: 'Failed to create conversation' });
    }
  });

  app.get('/api/conversations/:id/messages', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const conversationId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Verify user has access to this conversation
      const conversation = await storage.getConversation(conversationId);
      if (!conversation || !conversation.participantIds.includes(user.id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const messages = await storage.getConversationMessages(conversationId, limit, offset);
      
      // Get sender details for each message
      const messagesWithSenders = await Promise.all(
        messages.map(async (message) => {
          const sender = await storage.getUser(message.senderId);
          return {
            ...message,
            sender: sender ? {
              id: sender.id,
              username: sender.username,
              firstName: sender.firstName,
              lastName: sender.lastName
            } : null
          };
        })
      );
      
      res.json(messagesWithSenders.reverse()); // Return in chronological order
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.post('/api/conversations/:id/messages', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Message content is required' });
      }
      
      // Verify user has access to this conversation
      const conversation = await storage.getConversation(conversationId);
      if (!conversation || !conversation.participantIds.includes(user.id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const message = await storage.createMessage({
        conversationId,
        senderId: user.id,
        content: content.trim()
      });
      
      // Get sender details
      const sender = await storage.getUser(message.senderId);
      const messageWithSender = {
        ...message,
        sender: sender ? {
          id: sender.id,
          username: sender.username,
          firstName: sender.firstName,
          lastName: sender.lastName
        } : null
      };
      
      // Notify via WebSocket if available
      if (messagingWS) {
        messagingWS.notifyConversation(conversation.participantIds, {
          type: 'new_message',
          payload: { message: messageWithSender, conversationId }
        });
      }
      
      res.json(messageWithSender);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  app.patch('/api/messages/:id/read', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const messageId = parseInt(req.params.id);
      
      await storage.markMessageAsRead(messageId, user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ message: 'Failed to mark message as read' });
    }
  });

  app.get('/api/employees', requireAuth, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      const employeeList = employees.map(emp => ({
        id: emp.id,
        username: emp.username,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        role: emp.role
      }));
      res.json(employeeList);
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ message: 'Failed to fetch employees' });
    }
  });

  // BTCPay Invoice endpoints
  app.post('/api/invoice', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const validation = insertBtcpayInvoiceSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid invoice data', 
          errors: validation.error.errors 
        });
      }

      const { amountUsd, description, customerEmail, customerName } = validation.data;
      
      // Create BTCPay invoice
      const btcpayInvoice = await btcpayService.createInvoice({
        amount: parseFloat(amountUsd),
        currency: 'USD',
        description,
        customerEmail,
        customerName,
        orderId: validation.data.orderId,
        redirectUrl: `${req.protocol}://${req.get('host')}/invoice/success`,
        webhookUrl: `${req.protocol}://${req.get('host')}/api/invoice/webhook`
      });

      // Save to database
      const invoiceData = {
        btcpayInvoiceId: btcpayInvoice.id,
        orderId: btcpayInvoice.orderId,
        amountUsd: amountUsd,
        currency: 'USD',
        description,
        status: btcpayInvoice.status.toLowerCase() as 'new' | 'processing' | 'settled' | 'complete' | 'expired' | 'invalid',
        statusMessage: btcpayInvoice.statusMessage,
        customerEmail: customerEmail || undefined,
        customerName: customerName || undefined,
        paymentUrl: btcpayInvoice.paymentUrls.BIP21,
        lightningPaymentUrl: btcpayInvoice.paymentUrls.LIGHTNING,
        onChainPaymentUrl: btcpayInvoice.paymentUrls.BIP21,
        expiresAt: new Date(btcpayInvoice.expirationTime * 1000)
      };

      const savedInvoice = await storage.createBtcpayInvoice(invoiceData);

      res.status(201).json({
        ...savedInvoice,
        btcpayInvoice,
        paymentUrls: {
          bip21: btcpayInvoice.paymentUrls.BIP21,
          lightning: btcpayInvoice.paymentUrls.LIGHTNING,
          onchain: btcpayInvoice.paymentUrls.BIP21
        }
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      res.status(500).json({ message: 'Failed to create invoice' });
    }
  });

  app.get('/api/invoice/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const invoiceId = parseInt(req.params.id);
      
      const invoice = await storage.getBtcpayInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      // Get latest status from BTCPay
      try {
        const btcpayStatus = await btcpayService.getInvoiceStatus(invoice.btcpayInvoiceId);
        
        // Update local status if different
        if (btcpayStatus.status.toLowerCase() !== invoice.status) {
          await storage.updateBtcpayInvoice(invoice.id, {
            status: btcpayStatus.status.toLowerCase() as 'new' | 'processing' | 'settled' | 'complete' | 'expired' | 'invalid',
            statusMessage: btcpayStatus.statusMessage,
            totalPaid: btcpayService.getTotalPaid(btcpayStatus).toString(),
            paidDate: btcpayService.isInvoicePaid(btcpayStatus) ? new Date() : null
          });
        }

        // Get transactions
        const transactions = await storage.getBtcpayTransactions(invoice.id);
        
        res.json({
          ...invoice,
          btcpayStatus,
          transactions,
          isPaid: btcpayService.isInvoicePaid(btcpayStatus),
          isExpired: btcpayService.isInvoiceExpired(btcpayStatus),
          isPending: btcpayService.isInvoicePending(btcpayStatus),
          paymentUrls: {
            bip21: btcpayStatus.paymentUrls.BIP21,
            lightning: btcpayStatus.paymentUrls.LIGHTNING,
            onchain: btcpayStatus.paymentUrls.BIP21
          }
        });
      } catch (btcpayError) {
        console.error('Error fetching BTCPay status:', btcpayError);
        // Return local data if BTCPay is unavailable
        res.json({
          ...invoice,
          btcpayError: 'Unable to fetch latest status from BTCPay'
        });
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({ message: 'Failed to fetch invoice' });
    }
  });

  app.get('/api/invoices', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const invoices = await storage.getBtcpayInvoices();
      
      res.json(invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ message: 'Failed to fetch invoices' });
    }
  });

  // BTCPay webhook endpoint (no auth required)
  app.post('/api/invoice/webhook', async (req, res) => {
    try {
      const { invoiceId, status, statusMessage } = req.body;
      
      if (!invoiceId) {
        return res.status(400).json({ message: 'Invoice ID is required' });
      }

      // Find invoice by BTCPay ID
      const invoice = await storage.getBtcpayInvoiceByBtcpayId(invoiceId);
      if (!invoice) {
        console.warn(`Webhook received for unknown invoice: ${invoiceId}`);
        return res.status(404).json({ message: 'Invoice not found' });
      }

      // Update invoice status
      await storage.updateBtcpayInvoice(invoice.id, {
        status: status.toLowerCase(),
        statusMessage,
        paidDate: status.toLowerCase() === 'settled' || status.toLowerCase() === 'complete' ? new Date() : null
      });

      console.log(`Invoice ${invoiceId} status updated to: ${status}`);
      res.json({ success: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ message: 'Failed to process webhook' });
    }
  });

  // Helper function to calculate unread messages
  async function getUnreadCount(conversationId: number, userId: number): Promise<number> {
    const messages = await storage.getConversationMessages(conversationId);
    return messages.filter(msg => 
      !msg.readBy.includes(userId) && msg.senderId !== userId
    ).length;
  }

  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  initializeMessagingWebSocket(httpServer);
  
  return httpServer;
}
