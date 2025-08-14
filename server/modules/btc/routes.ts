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
    return 0;
  }
}

export function btcRoutes(app: Express) {
  // Get current BTC rate
  app.get('/api/btc-rate', async (req, res) => {
    try {
      const rate = await fetchBtcRate();
      res.json({ rate });
    } catch (error) {
      console.error('BTC rate error:', error);
      res.status(500).json({ message: 'Failed to fetch BTC rate' });
    }
  });
}

export default btcRoutes;