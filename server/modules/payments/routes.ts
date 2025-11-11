import type { Express } from "express";
import { requireAuth, requireAdmin, requireSuperAdmin } from "../../auth";
import { plaidService } from "../../services/plaid-service";
import { paymentOrchestrator } from "../../orchestrators/payment-orchestrator";
import { z } from "zod";

// Validation schemas
const fundWalletSchema = z.object({
  amountUsd: z.number().positive(),
  plaidAccountId: z.number().int().positive(),
  description: z.string().optional(),
});

const swapSchema = z.object({
  direction: z.enum(['btc_to_usd', 'usd_to_btc']),
  amount: z.number().positive(),
  description: z.string().optional(),
});

const payoutSchema = z.object({
  amountSats: z.number().int().positive(),
  description: z.string().min(1),
  walletId: z.number().int().positive().optional(),
});

export function registerPaymentRoutes(app: Express): void {
  // Plaid Link token endpoint
  app.post('/api/payments/plaid/link-token', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const linkToken = await plaidService.createLinkToken(user.id, user.companyId);
      
      res.json({ linkToken });
    } catch (error) {
      console.error('Plaid link token error:', error);
      res.status(500).json({ error: 'Failed to create Plaid link token' });
    }
  });

  // Exchange Plaid public token
  app.post('/api/payments/plaid/exchange-token', requireAuth, async (req, res) => {
    try {
      const { publicToken } = req.body;
      const user = req.user!;

      if (!publicToken) {
        return res.status(400).json({ error: 'Public token is required' });
      }

      const account = await plaidService.exchangePublicToken(publicToken, user.id, user.companyId);
      
      res.json({ 
        message: 'Account linked successfully',
        account: {
          id: account.id,
          accountName: account.accountName,
          accountType: account.accountType,
          accountMask: account.accountMask,
          institutionName: account.institutionName,
        }
      });
    } catch (error) {
      console.error('Plaid token exchange error:', error);
      res.status(500).json({ error: 'Failed to exchange public token' });
    }
  });

  // Get connected accounts
  app.get('/api/payments/plaid/accounts', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const accounts = await plaidService.getAccounts(user.id, user.companyId);
      
      res.json({
        accounts: accounts.map(account => ({
          id: account.id,
          accountName: account.accountName,
          accountType: account.accountType,
          accountMask: account.accountMask,
          institutionName: account.institutionName,
          status: account.status,
        }))
      });
    } catch (error) {
      console.error('Plaid accounts error:', error);
      res.status(500).json({ error: 'Failed to retrieve accounts' });
    }
  });

  // Fund company wallet
  app.post('/api/payments/fund-wallet', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const validatedData = fundWalletSchema.parse(req.body);

      const result = await paymentOrchestrator.fundCompanyWallet({
        companyId: user.companyId,
        userId: user.id,
        amountUsd: validatedData.amountUsd,
        plaidAccountId: validatedData.plaidAccountId,
        description: validatedData.description,
      });

      res.json({
        message: 'Wallet funding initiated',
        paymentIntentId: result.paymentIntentId,
        status: result.status,
      });
    } catch (error) {
      console.error('Fund wallet error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fund wallet' });
    }
  });

  // Get payment status
  app.get('/api/payments/status/:paymentIntentId', requireAuth, async (req, res) => {
    try {
      const { paymentIntentId } = req.params;
      const result = await paymentOrchestrator.getPaymentStatus(paymentIntentId);
      
      res.json(result);
    } catch (error) {
      console.error('Payment status error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get payment status' });
    }
  });

  // Employee swap (BTC to USD or USD to BTC)
  app.post('/api/payments/swap', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const validatedData = swapSchema.parse(req.body);

      const result = await paymentOrchestrator.processEmployeeSwap({
        companyId: user.companyId,
        userId: user.id,
        direction: validatedData.direction,
        amount: validatedData.amount,
        description: validatedData.description,
      });

      res.json({
        message: 'Swap initiated',
        status: result.status,
        transactionId: result.transactionId,
      });
    } catch (error) {
      console.error('Swap error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to process swap' });
    }
  });

  // Employee payout
  app.post('/api/payments/payout', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const validatedData = payoutSchema.parse(req.body);

      const result = await paymentOrchestrator.processEmployeePayout({
        companyId: user.companyId,
        userId: user.id,
        amountSats: validatedData.amountSats,
        description: validatedData.description,
        walletId: validatedData.walletId,
      });

      res.json({
        message: 'Payout initiated',
        status: result.status,
        invoiceId: result.invoiceId,
      });
    } catch (error) {
      console.error('Payout error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to process payout' });
    }
  });

  // Get transaction history
  app.get('/api/payments/transactions', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const { limit = 50 } = req.query;
      
      const transactions = await paymentOrchestrator.getTransactionHistory(
        user.id,
        user.companyId,
        parseInt(limit as string)
      );

      res.json({ transactions });
    } catch (error) {
      console.error('Transaction history error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get transaction history' });
    }
  });

  // Remove Plaid account
  app.delete('/api/payments/plaid/accounts/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const accountId = parseInt(id);
      const user = req.user!;

      // Verify account belongs to user
      const account = await plaidService.getAccounts(user.id, user.companyId);
      const targetAccount = account.find(acc => acc.id === accountId);
      
      if (!targetAccount) {
        return res.status(404).json({ error: 'Account not found' });
      }

      await plaidService.removeAccount(accountId);
      
      res.json({ message: 'Account removed successfully' });
    } catch (error) {
      console.error('Remove account error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to remove account' });
    }
  });
}
