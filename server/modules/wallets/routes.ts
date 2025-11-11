import type { Express } from "express";
import { requireAuth, requireAdmin, requireSuperAdmin } from "../../auth";
import { breezService } from "../../services/breez-service";
import { paymentOrchestrator } from "../../orchestrators/payment-orchestrator";
import { storage } from "../../storage";
import { z } from "zod";

// Validation schemas
const initializeWalletSchema = z.object({
  walletType: z.enum(['company', 'employee']),
});

const generateInvoiceSchema = z.object({
  amountSats: z.number().int().positive(),
  description: z.string().min(1),
});

const payInvoiceSchema = z.object({
  invoice: z.string().min(1),
});

export function registerWalletRoutes(app: Express): void {
  // Get company wallet details
  app.get('/api/wallets/company', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const balance = await paymentOrchestrator.getWalletBalance(user.id, user.companyId, 'company');
      
      res.json({
        walletType: 'company',
        balance,
        currency: 'sats',
      });
    } catch (error) {
      console.error('Company wallet error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get company wallet' });
    }
  });

  // Get employee wallet details
  app.get('/api/wallets/employee/:userId?', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const targetUserId = req.params.userId ? parseInt(req.params.userId) : user.id;
      
      // Check permissions
      if (targetUserId !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Unauthorized to access this wallet' });
      }

      const balance = await paymentOrchestrator.getWalletBalance(targetUserId, user.companyId, 'employee');
      
      res.json({
        walletType: 'employee',
        userId: targetUserId,
        balance,
        currency: 'sats',
      });
    } catch (error) {
      console.error('Employee wallet error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get employee wallet' });
    }
  });

  // Initialize Breez wallet
  app.post('/api/wallets/breez/initialize', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const validatedData = initializeWalletSchema.parse(req.body);

      // Check permissions for company wallet
      if (validatedData.walletType === 'company' && user.role !== 'admin' && user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only admins can initialize company wallets' });
      }

      const wallet = await breezService.initializeWallet(
        user.id,
        user.companyId,
        validatedData.walletType
      );

      res.json({
        message: 'Wallet initialized successfully',
        wallet: {
          id: wallet.id,
          walletType: wallet.walletType,
          status: wallet.status,
          balance: wallet.balance,
        },
      });
    } catch (error) {
      console.error('Wallet initialization error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to initialize wallet' });
    }
  });

  // Generate Lightning invoice
  app.post('/api/wallets/breez/invoice', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const validatedData = generateInvoiceSchema.parse(req.body);

      // Get user's wallet
      const userWallets = await storage.getBreezWalletsByUser(user.id);
      let userWallet = userWallets.find(w => w.walletType === 'employee');
      
      if (!userWallet) {
        return res.status(404).json({ error: 'Employee wallet not found. Please initialize it first.' });
      }

      const invoice = await breezService.generateInvoice(
        userWallet.id,
        validatedData.amountSats,
        validatedData.description
      );

      res.json({
        message: 'Invoice generated successfully',
        invoice: {
          invoiceId: invoice.invoiceId,
          invoice: invoice.invoice,
          amountSats: invoice.amountSats,
          description: validatedData.description,
          expiresAt: invoice.expiresAt,
          status: invoice.status,
        },
      });
    } catch (error) {
      console.error('Invoice generation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate invoice' });
    }
  });

  // Pay Lightning invoice
  app.post('/api/wallets/breez/pay', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const validatedData = payInvoiceSchema.parse(req.body);

      // Get user's wallet
      const userWallets = await storage.getBreezWalletsByUser(user.id);
      let userWallet = userWallets.find(w => w.walletType === 'employee');
      
      if (!userWallet) {
        return res.status(404).json({ error: 'Employee wallet not found. Please initialize it first.' });
      }

      const payment = await breezService.payInvoice(userWallet.id, validatedData.invoice);

      res.json({
        message: 'Payment initiated',
        payment: {
          paymentId: payment.paymentId,
          amountSats: payment.amountSats,
          status: payment.status,
          transactionHash: payment.transactionHash,
        },
      });
    } catch (error) {
      console.error('Invoice payment error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to pay invoice' });
    }
  });

  // Get wallet balance
  app.get('/api/wallets/balance', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const { type = 'employee' } = req.query;
      
      const balance = await paymentOrchestrator.getWalletBalance(
        user.id,
        user.companyId,
        type as 'company' | 'employee'
      );

      res.json({
        balance,
        currency: 'sats',
        walletType: type,
      });
    } catch (error) {
      console.error('Wallet balance error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get wallet balance' });
    }
  });

  // Sync wallet
  app.post('/api/wallets/sync', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const { walletId } = req.body;

      if (!walletId) {
        return res.status(400).json({ error: 'Wallet ID is required' });
      }

      // Verify wallet belongs to user
      const wallet = await storage.getBreezWalletById(walletId);
      if (!wallet || wallet.userId !== user.id) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      const nodeInfo = await breezService.syncWallet(walletId);

      res.json({
        message: 'Wallet synced successfully',
        nodeInfo: {
          nodeId: nodeInfo.nodeId,
          alias: nodeInfo.alias,
          balance: nodeInfo.balance,
          channels: nodeInfo.channels,
        },
      });
    } catch (error) {
      console.error('Wallet sync error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to sync wallet' });
    }
  });

  // Get transaction history for wallet
  app.get('/api/wallets/transactions', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const { walletId, limit = 50 } = req.query;

      if (!walletId) {
        return res.status(400).json({ error: 'Wallet ID is required' });
      }

      // Verify wallet belongs to user
      const wallet = await storage.getBreezWalletById(parseInt(walletId as string));
      if (!wallet || wallet.userId !== user.id) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      const transactions = await breezService.getTransactionHistory(
        parseInt(walletId as string),
        parseInt(limit as string)
      );

      res.json({ transactions });
    } catch (error) {
      console.error('Wallet transactions error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get wallet transactions' });
    }
  });

  // Get all wallets for company (admin only)
  app.get('/api/wallets/company/all', requireAdmin, async (req, res) => {
    try {
      const user = req.user!;
      const wallets = await storage.getBreezWalletsByCompany(user.companyId);

      res.json({
        wallets: wallets.map(wallet => ({
          id: wallet.id,
          walletType: wallet.walletType,
          userId: wallet.userId,
          status: wallet.status,
          balance: wallet.balance,
          createdAt: wallet.createdAt,
        })),
      });
    } catch (error) {
      console.error('Company wallets error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get company wallets' });
    }
  });
}
