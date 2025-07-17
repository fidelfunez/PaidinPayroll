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

  async getInvoice(invoice 