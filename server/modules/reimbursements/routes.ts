import type { Express } from "express";
import { requireAuth } from "../../auth";
import { storage } from "../../storage";
import { insertExpenseReimbursementSchema } from "@shared/schema";

// Bitcoin API utility
async function fetchBtcRate(): Promise<number> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const data = await response.json();
    return data.bitcoin.usd;
  } catch (error) {
    console.error('Failed to fetch BTC rate:', error);
    const lastRate = await storage.getLatestBtcRate();
    return lastRate ? parseFloat(lastRate.rate) : 118509;
  }
}

export default function reimbursementRoutes(app: Express) {
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
        amountBtc: amountBtc,
        btcRate: currentRate,
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
} 