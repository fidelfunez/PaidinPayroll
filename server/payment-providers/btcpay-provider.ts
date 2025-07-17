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
    await this.btcpayService.markInvoiceInvalid(invoiceId);
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
    return invoice.qrCode || '';
  }

  private mapBTCPayInvoiceToPaymentInvoice(btcpayInvoice: any): PaymentInvoice {
    const status = this.mapBTCPayStatus(btcpayInvoice.status);
    const btcAmount = btcpayInvoice.paymentSubtotals?.BTC || 0;

    return {
      id: btcpayInvoice.id,
      amount: btcpayInvoice.amount,
      currency: btcpayInvoice.currency,
      status,
      paymentUrl: btcpayInvoice.paymentUrls?.BIP21 || '',
      qrCode: btcpayInvoice.paymentUrls?.BIP21 || '',
      btcAmount,
      expiresAt: new Date(btcpayInvoice.expirationTime * 1000),
      createdAt: new Date(btcpayInvoice.createdTime * 1000),
      paidAt: status === 'paid' ? new Date() : undefined,
      transactions: btcpayInvoice.transactions?.map((tx: any) => ({
        id: tx.id,
        amount: tx.amount,
        confirmations: tx.confirmations,
        txid: tx.txid,
        timestamp: new Date(tx.timestamp * 1000),
      })) || [],
    };
  }

  private mapBTCPayStatus(btcpayStatus: string): 'pending' | 'paid' | 'expired' | 'invalid' {
    switch (btcpayStatus.toLowerCase()) {
      case 'new':
      case 'pending':
        return 'pending';
      case 'paid':
      case 'confirmed':
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