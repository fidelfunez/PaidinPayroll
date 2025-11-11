import { storage } from './storage';
import { paymentService } from './payment-service';

export class PaymentPollingService {
  private static instance: PaymentPollingService;
  private pollingInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): PaymentPollingService {
    if (!PaymentPollingService.instance) {
      PaymentPollingService.instance = new PaymentPollingService();
    }
    return PaymentPollingService.instance;
  }

  startPolling() {
    if (this.pollingInterval) {
      return; // Already polling
    }

    // Only start polling if payment service is available
    // Don't crash if payment service isn't configured
    try {
      this.pollingInterval = setInterval(async () => {
        try {
          await this.checkPendingPayments();
        } catch (error) {
          // Silently handle errors - don't log unless it's a critical issue
          // Payment polling is optional and shouldn't crash the server
          console.error('Payment polling error (non-critical):', error);
        }
      }, 60000); // Check every minute
      
      console.log('Payment polling service initialized');
    } catch (error) {
      console.warn('Payment polling service not available:', error);
      console.warn('Server will continue without payment polling');
    }
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async checkPendingPayments() {
    try {
      // Check if payment service is available
      if (!paymentService) {
        return; // Payment service not available, skip polling
      }

      // Try to get pending invoices - if this fails, skip this polling cycle
      let pendingInvoices;
      try {
        pendingInvoices = await storage.getInvoices();
      } catch (error) {
        console.warn('Failed to get invoices for payment polling:', error);
        return; // Skip this cycle if we can't get invoices
      }

      const invoicesWithPayments = pendingInvoices.filter(invoice => 
        invoice.status === 'sent' && invoice.paymentUrl
      );

      // Only process if there are invoices to check
      if (invoicesWithPayments.length === 0) {
        return;
      }

      for (const invoice of invoicesWithPayments) {
        try {
          // Try to get payment status - if this fails, skip this invoice
          const paymentStatus = await paymentService.getInvoiceStatus(invoice.paymentUrl!);
          
          if (paymentStatus.status === 'paid' && invoice.status !== 'paid') {
            await storage.updateInvoiceStatus(invoice.id, 'paid');
            console.log(`Invoice ${invoice.id} marked as paid`);
          } else if (paymentStatus.status === 'expired' && invoice.status !== 'overdue') {
            await storage.updateInvoiceStatus(invoice.id, 'overdue');
            console.log(`Invoice ${invoice.id} marked as overdue`);
          }
        } catch (error) {
          // Log but don't throw - individual invoice errors shouldn't stop polling
          // This is expected if BTCPay isn't configured or service is unavailable
          if (error instanceof Error && error.message.includes('BTCPay')) {
            // BTCPay not configured - this is expected, just skip polling
            return;
          }
          console.error(`Error checking payment status for invoice ${invoice.id}:`, error);
        }
      }
    } catch (error) {
      // Log but don't throw - payment polling errors shouldn't crash the server
      // This service is optional and failures should be graceful
      if (error instanceof Error && error.message.includes('BTCPay')) {
        // BTCPay not configured - stop polling until it's configured
        console.warn('Payment polling disabled: BTCPay not configured');
        this.stopPolling();
        return;
      }
      console.error('Error in payment polling (non-critical):', error);
    }
  }
}

export const paymentPolling = PaymentPollingService.getInstance(); 