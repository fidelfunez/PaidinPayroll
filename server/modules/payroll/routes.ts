import type { Express } from "express";
import { requireAuth, requireSuperAdmin } from "../../auth";
import { storage } from "../../storage";
import { lnbitsService } from "../../lnbits";
import { insertPayrollPaymentSchema } from "@shared/schema";

export default function payrollRoutes(app: Express) {
  // Get all payroll payments (filtered by user if not admin)
  app.get('/api/payroll', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.role === 'admin' ? undefined : req.user?.id;
      const payments = await storage.getPayrollPayments(userId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch payroll payments' });
    }
  });

  // Create new payroll payment
  app.post('/api/payroll', requireAuth, async (req, res) => {
    try {
      const validation = insertPayrollPaymentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid payment data' });
      }

      // Ensure user has companyId
      if (!req.user?.companyId) {
        return res.status(400).json({ message: 'User must be associated with a company' });
      }

      // Get current BTC rate
      const currentBtcRate = await storage.getLatestBtcRate();
      if (!currentBtcRate) {
        return res.status(500).json({ message: 'Unable to get current Bitcoin rate' });
      }

      const amountUsd = parseFloat(validation.data.amountUsd?.toString() || '0');
      const amountBtc = amountUsd / parseFloat(currentBtcRate.rate);

      const paymentData = {
        ...validation.data,
        companyId: req.user.companyId,
        amountBtc: amountBtc,
        btcRate: parseFloat(currentBtcRate.rate)
      } as any; // Type assertion to bypass schema validation for computed fields

      const payment = await storage.createPayrollPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      console.error('Payroll creation error:', error);
      res.status(500).json({ message: 'Failed to create payroll payment' });
    }
  });

  // Update payroll payment
  app.patch('/api/payroll/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid payment ID' });
      }

      const updates = req.body;
      const payment = await storage.updatePayrollPayment(id, updates);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update payment' });
    }
  });

  // Create Lightning invoice for payroll payment
  app.post('/api/payroll/:id/create-lightning-invoice', requireSuperAdmin, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      if (isNaN(paymentId)) {
        return res.status(400).json({ message: 'Invalid payment ID' });
      }

      // Get the payment
      const payment = await storage.getPayrollPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Check if user has permission (admin or payment owner)
      if (req.user?.role !== 'admin' && payment.userId !== req.user?.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Convert USD amount to satoshis
      const currentBtcRate = await storage.getLatestBtcRate();
      if (!currentBtcRate) {
        return res.status(500).json({ message: 'Unable to get current Bitcoin rate' });
      }

      const amountUsd = parseFloat(payment.amountUsd?.toString() || '0');
      const amountSats = lnbitsService.usdToSatoshis(amountUsd, parseFloat(currentBtcRate.rate));

      // Create Lightning invoice
      const memo = `Payroll payment for ${payment.userId} - ${new Date().toISOString()}`;
      const lightningInvoice = await lnbitsService.createInvoice(amountSats, memo);

      // Update payment with Lightning invoice details
      const updatedPayment = await storage.updatePayrollPayment(paymentId, {
        status: 'processing',
        transactionHash: lightningInvoice.payment_hash,
        paidDate: new Date()
      });

      res.json({
        payment: updatedPayment,
        lightningInvoice: {
          paymentRequest: lightningInvoice.bolt11 || lightningInvoice.payment_request,
          paymentHash: lightningInvoice.payment_hash,
          amountSats: amountSats,
          amountUsd: amountUsd,
          memo: memo
        }
      });

    } catch (error) {
      console.error('Lightning invoice creation error:', error);
      res.status(500).json({ 
        message: 'Failed to create Lightning invoice. Please try again.' 
      });
    }
  });

  // Reset payment status from processing to pending (for retry)
  app.post('/api/payroll/:id/reset-payment', requireAuth, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      if (isNaN(paymentId)) {
        return res.status(400).json({ message: 'Invalid payment ID' });
      }

      // Only admins can reset payments
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Only administrators can reset payments' });
      }

      // Get the payment
      const payment = await storage.getPayrollPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Only allow resetting from processing status
      if (payment.status !== 'processing') {
        return res.status(400).json({ message: 'Can only reset payments from processing status' });
      }

      // Reset payment to pending
      const updatedPayment = await storage.updatePayrollPayment(paymentId, {
        status: 'pending',
        transactionHash: null,
        paidDate: null
      });

      res.json({ payment: updatedPayment });

    } catch (error) {
      console.error('Payment reset error:', error);
      res.status(500).json({ 
        message: 'Failed to reset payment. Please try again.' 
      });
    }
  });

  // Process Lightning payment (send payment to employee)
  app.post('/api/payroll/:id/process-lightning-payment', requireSuperAdmin, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      if (isNaN(paymentId)) {
        return res.status(400).json({ message: 'Invalid payment ID' });
      }

      // Only admins can process payments
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Only administrators can process payments' });
      }

      // Get the payment
      const payment = await storage.getPayrollPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      const { lightningAddress } = req.body;
      if (!lightningAddress) {
        return res.status(400).json({ message: 'Lightning address is required' });
      }

      // Validate Lightning address
      if (!lnbitsService.isValidLightningAddress(lightningAddress)) {
        return res.status(400).json({ message: 'Invalid Lightning address format' });
      }

      // Convert USD amount to satoshis
      const currentBtcRate = await storage.getLatestBtcRate();
      if (!currentBtcRate) {
        return res.status(500).json({ message: 'Unable to get current Bitcoin rate' });
      }

      const amountUsd = parseFloat(payment.amountUsd?.toString() || '0');
      const amountSats = lnbitsService.usdToSatoshis(amountUsd, parseFloat(currentBtcRate.rate));

      // Send Lightning payment
      const memo = `Payroll payment - ${new Date().toISOString()}`;
      const paymentResult = await lnbitsService.payToLightningAddress(lightningAddress, amountSats, memo);

      // Update payment status
      const updatedPayment = await storage.updatePayrollPayment(paymentId, {
        status: 'completed',
        transactionHash: paymentResult.payment_hash,
        paidDate: new Date()
      });

      res.json({
        payment: updatedPayment,
        lightningPayment: {
          paymentHash: paymentResult.payment_hash,
          amountSats: amountSats,
          amountUsd: amountUsd,
          lightningAddress: lightningAddress,
          memo: memo
        }
      });

    } catch (error) {
      console.error('Lightning payment error:', error);
      res.status(500).json({ 
        message: 'Failed to process Lightning payment. Please try again.' 
      });
    }
  });

  // Get Lightning payment status
  app.get('/api/payroll/:id/lightning-status', requireSuperAdmin, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      if (isNaN(paymentId)) {
        return res.status(400).json({ message: 'Invalid payment ID' });
      }

      const payment = await storage.getPayrollPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      if (!payment.transactionHash) {
        return res.status(400).json({ message: 'No Lightning transaction found for this payment' });
      }

      // Get payment status from LNbits
      const paymentStatus = await lnbitsService.getPaymentStatus(payment.transactionHash?.toString() || '');

      res.json({
        payment: payment,
        lightningStatus: paymentStatus
      });

    } catch (error) {
      console.error('Lightning status check error:', error);
      res.status(500).json({ 
        message: 'Failed to check Lightning payment status' 
      });
    }
  });

  // Get Lightning wallet balance
  app.get('/api/lightning/balance', requireSuperAdmin, async (req, res) => {
    try {

      const balance = await lnbitsService.getWalletBalance();
      const currentBtcRate = await storage.getLatestBtcRate();
      
      let balanceUsd = 0;
      if (currentBtcRate) {
        balanceUsd = lnbitsService.satoshisToUsd(balance.balance, parseFloat(currentBtcRate.rate));
      }

      res.json({
        balanceSats: balance.balance,
        balanceUsd: balanceUsd,
        btcRate: currentBtcRate?.rate
      });

    } catch (error) {
      console.error('Wallet balance error:', error);
      res.status(500).json({ 
        message: 'Failed to get wallet balance' 
      });
    }
  });
}
