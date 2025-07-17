import { PaymentProviderFactory } from './payment-providers/factory';
import { PaymentService, CreatePaymentRequest, PaymentInvoice } from './payment-providers/types';
import { storage } from './storage';

export class PaymentServiceManager {
  private static instance: PaymentServiceManager;
  private currentProvider: PaymentService | null = null;

  private constructor() {}

  static getInstance(): PaymentServiceManager {
    if (!PaymentServiceManager.instance) {
      PaymentServiceManager.instance = new PaymentServiceManager();
    }
    return PaymentServiceManager.instance;
  }

  async initializeProvider(provider: 'btcpay' | 'lnbits' | 'noop'): Promise<void> {
    if (provider === 'btcpay') {
      const config = await storage.getBTCPayConfig();
      if (!config) {
        throw new Error('BTCPay configuration not found. Please configure BTCPay integration first.');
      }
      this.currentProvider = PaymentProviderFactory.createProvider('btcpay', config);
    } else {
      throw new Error(`Provider ${provider} not implemented yet`);
    }
  }

  async createInvoice(data: CreatePaymentRequest): Promise<PaymentInvoice> {
    if (!this.currentProvider) {
      await this.initializeProvider('btcpay');
    }
    
    if (!this.currentProvider) {
      throw new Error('No payment provider available');
    }

    return this.currentProvider.createInvoice(data);
  }

  async getInvoiceStatus(invoiceId: string): Promise<PaymentInvoice> {
    if (!this.currentProvider) {
      await this.initializeProvider('btcpay');
    }
    
    if (!this.currentProvider) {
      throw new Error('No payment provider available');
    }

    return this.currentProvider.getInvoiceStatus(invoiceId);
  }

  async getInvoice(invoiceId: string): Promise<PaymentInvoice> {
    if (!this.currentProvider) {
      await this.initializeProvider('btcpay');
    }
    
    if (!this.currentProvider) {
      throw new Error('No payment provider available');
    }

    return this.currentProvider.getInvoice(invoiceId);
  }

  async markInvoiceInvalid(invoiceId: string): Promise<void> {
    if (!this.currentProvider) {
      await this.initializeProvider('btcpay');
    }
    
    if (!this.currentProvider) {
      throw new Error('No payment provider available');
    }

    return this.currentProvider.markInvoiceInvalid(invoiceId);
  }
}

export const paymentService = PaymentServiceManager.getInstance(); 