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
    const lastRate = await storage.getLatestBtcRate();
    return lastRate ? parseFloat(lastRate.rate) : 43250;
  }
}

export default function btcRoutes(app: Express) {
  // BTC rate endpoints
  app.get('/api/btc/rate', requireAuth, async (req, res) => {
    try {
      const rate = await fetchBtcRate();
      res.json({ rate });
    } catch (error) {
      console.error('Failed to fetch BTC rate:', error);
      res.status(500).json({ message: 'Failed to fetch BTC rate' });
    }
  });

  app.get('/api/btc/rate/history', requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const history = await storage.getBtcRateHistory(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(history);
    } catch (error) {
      console.error('Failed to fetch BTC rate history:', error);
      res.status(500).json({ message: 'Failed to fetch BTC rate history' });
    }
  });

  // BTCPay endpoints
  app.get('/api/btc/invoices', requireAuth, async (req, res) => {
    try {
      const invoices = await storage.getBtcpayInvoices();
      res.json(invoices);
    } catch (error) {
      console.error('Failed to fetch BTCPay invoices:', error);
      res.status(500).json({ message: 'Failed to fetch BTCPay invoices' });
    }
  });

  app.get('/api/btc/invoices/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getBtcpayInvoice(id);
      
      if (!invoice) {
        return res.status(404).json({ message: 'BTCPay invoice not found' });
      }
      
      res.json(invoice);
    } catch (error) {
      console.error('Failed to fetch BTCPay invoice:', error);
      res.status(500).json({ message: 'Failed to fetch BTCPay invoice' });
    }
  });
}