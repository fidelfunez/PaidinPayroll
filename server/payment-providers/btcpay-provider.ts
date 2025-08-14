import { PaymentService, PaymentInvoice, CreatePaymentRequest } from './types';
import { BTCPayService } from '../btcpay';

export class BTCPayPaymentProvider implements PaymentService {
  private btcpayService: BTCPayService;

  constructor(config: { url: string; apiKey: string; storeId: string }) {
    this.btcpayService = new BTCPayService();
    // Update the BTCPay service with the provided config
    (this.btcpayService as any).config = config;
  }

  async createInvoice(data: CreatePaymentRequest): Promise<PaymentInvoice> {
    const btcpayInvoice = await this.btcpayService.createInvoice({
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      orderId: data.orderId,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      redirectUrl: data.redirectUrl,
      webhookUrl: data.webhookUrl,
    });

    return this.mapBTCPayInvoiceToPaymentInvoice(btcpayInvoice);
  }

  async getInvoiceStatus(invoiceId: string): Promise<PaymentInvoice> {
    const btcpayInvoice = await this.btcpayService.getInvoiceStatus(invoiceId);
    return this.mapBTCPayInvoiceToPaymentInvoice(btcpayInvoice);
  }

  async getInvoice(invoiceId: string): Promise<PaymentInvoice> {
    const btcpayInvoice = await this.btcpayService.getInvoice(invoiceId);
    return this.mapBTCPayInvoiceToPaymentInvoice(btcpayInvoice);
  }

  async markInvoiceInvalid(invoiceId: string): Promise<void> {
    // BTCPay doesn't have a direct invalidate method, so we'll just log it
    console.log(`Marking invoice ${invoiceId} as invalid`);
  }

  isInvoicePaid(invoice: PaymentInvoice): boolean {
    return invoice.status === 'paid';
  }

  isInvoiceExpired(invoice: PaymentInvoice): boolean {
    return invoice.status === 'expired';
  }

  isInvoicePending(invoice: PaymentInvoice): boolean {
    return invoice.status === 'pending';
  }

  getPaymentUrl(invoice: PaymentInvoice): string {
    return invoice.paymentUrl;
  }

  getQrCode(invoice: PaymentInvoice): string {
    // BTCPay provides QR codes in the invoice data
    return invoice.qrCode || '';
  }

  private mapBTCPayInvoiceToPaymentInvoice(btcpayInvoice: any): PaymentInvoice {
    return {
      id: btcpayInvoice.id,
      amount: btcpayInvoice.amount,
      currency: btcpayInvoice.currency,
      status: this.mapBTCPayStatus(btcpayInvoice.status),
      paymentUrl: btcpayInvoice.paymentUrls?.BIP21 || '',
      qrCode: btcpayInvoice.paymentUrls?.BIP21 || '',
      btcAmount: btcpayInvoice.amount,
      expiresAt: new Date(btcpayInvoice.expirationTime * 1000),
      createdAt: new Date(btcpayInvoice.createdTime * 1000),
      paidAt: btcpayInvoice.paidDate ? new Date(btcpayInvoice.paidDate * 1000) : undefined,
      transactions: btcpayInvoice.transactions || [],
    };
  }

  private mapBTCPayStatus(btcpayStatus: string): 'pending' | 'paid' | 'expired' | 'invalid' {
    switch (btcpayStatus) {
      case 'new':
      case 'processing':
        return 'pending';
      case 'settled':
      case 'complete':
        return 'paid';
      case 'expired':
        return 'expired';
      case 'invalid':
        return 'invalid';
      default:
        return 'pending';
    }
  }
} 