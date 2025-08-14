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
    return 50000; // Default fallback rate
  }
}

export default function dashboardRoutes(app: Express) {
  // Dashboard stats endpoint
  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const btcRate = await fetchBtcRate();
      
      // Get basic stats
      const stats = {
        currentBtcRate: btcRate,
        userRole: user.role,
        // Add more stats as needed
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });
} 