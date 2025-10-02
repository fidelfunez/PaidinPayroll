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
    return 118509; // Current BTC rate fallback
  }
}

export default function dashboardRoutes(app: Express) {
  // Dashboard stats endpoint
  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const btcRate = await fetchBtcRate();
      
      // Get employees for calculations
      const employees = await storage.getEmployees();
      const activeEmployees = employees?.filter(emp => emp.isActive) || [];
      
      // Get payroll payments
      const payments = await storage.getPayrollPayments();
      const pendingPayments = payments?.filter(payment => payment.status === 'pending') || [];
      
      // Calculate stats
      const totalBtcBalance = 0; // Placeholder - would need actual BTC balance tracking
      const totalBtcBalanceUsd = totalBtcBalance * btcRate;
      const pendingPaymentsCount = pendingPayments.length;
      const pendingPaymentsAmount = pendingPayments.reduce((sum, payment) => sum + parseFloat(payment.amountUsd?.toString() || '0'), 0);
      const monthlyPayrollUsd = activeEmployees.reduce((sum, emp) => sum + parseFloat(emp.monthlySalary?.toString() || '0'), 0);
      
      // Get recent activity (placeholder)
      const recentActivity = [
        {
          type: 'payment',
          description: 'Payroll processed',
          amount: '$5,000.00',
          date: new Date().toISOString(),
          status: 'completed'
        }
      ];
      
      const stats = {
        totalBtcBalance,
        totalBtcBalanceUsd,
        pendingPaymentsCount,
        pendingPaymentsAmount,
        monthlyPayrollUsd,
        activeEmployees: activeEmployees.length,
        currentBtcRate: btcRate,
        recentActivity,
        userRole: user.role,
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      // Return default stats to prevent frontend errors
      const defaultStats = {
        totalBtcBalance: 0,
        totalBtcBalanceUsd: 0,
        pendingPaymentsCount: 0,
        pendingPaymentsAmount: 0,
        monthlyPayrollUsd: 0,
        activeEmployees: 0,
        currentBtcRate: 118509,
        recentActivity: [],
        userRole: req.user?.role || 'employee',
      };
      res.json(defaultStats);
    }
  });
} 