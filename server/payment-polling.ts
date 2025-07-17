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

    this.pollingInterval = setInterval(async () => {
      try {
        await this.checkPendingPayments();
      } catch (error) {
        console.error('Payment polling error:', error);
      }
    }, 60000); // Check every minute
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async checkPendingPayments() {
    try {
      // Get all pending invoices
      const pendingInvoices = await storage.getInvoices();
      const invoicesWithPayments = pendingInvoices.filter(invoice => 
        invoice.status === 'sent' && invoice.paymentUrl
      );

      for (const invoice of invoicesWithPayments) {
        try {
          const paymentStatus = await paymentService.getInvoiceStatus(invoice.paymentUrl!);
          
          if (paymentStatus.status === 'paid' && invoice.status !== 'paid') {
            await storage.updateInvoiceStatus(invoice.id, 'paid');
            console.log(`Invoice ${invoice.id} marked as paid`);
          } else if (paymentStatus.status === 'expired' && invoice.status !== 'overdue') {
            await storage.updateInvoiceStatus(invoice.id, 'overdue');
            console.log(`Invoice ${invoice.id} marked as overdue`);
          }
        } catch (error) {
          console.error(`Error checking payment status for invoice ${invoice.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in payment polling:', error);
    }
  }
}

export const paymentPolling = PaymentPollingService.getInstance(); 