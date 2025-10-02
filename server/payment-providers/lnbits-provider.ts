import { PaymentService, PaymentInvoice, CreatePaymentRequest } from './types';

interface LNBitsConfig {
  baseUrl: string;
  apiKey: string;
  adminKey: string;
  walletId: string;
}

interface LNBitsInvoice {
  payment_hash: string;
  payment_request: string;
  amount: number;
  fee: number;
  memo: string;
  time: number;
  settled: boolean;
  settled_at?: number;
  expiry: number;
  created_at: number;
}

export class LNBitsPaymentProvider implements PaymentService {
  private config: LNBitsConfig;

  constructor(config: LNBitsConfig) {
    this.config = config;
  }

  async createInvoice(data: CreatePaymentRequest): Promise<PaymentInvoice> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/payments`, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        out: false,
        amount: Math.round(data.amount * 1000), // Convert USD to millisats (approximate)
        memo: data.description,
        unit: 'msat',
        webhook: data.webhookUrl,
        internal: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LNBits API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const lnbitsInvoice: LNBitsInvoice = await response.json();
    return this.mapLNBitsInvoiceToPaymentInvoice(lnbitsInvoice);
  }

  async getInvoiceStatus(invoiceId: string): Promise<PaymentInvoice> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/payments/${invoiceId}`, {
      headers: {
        'X-Api-Key': this.config.apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LNBits API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const lnbitsInvoice: LNBitsInvoice = await response.json();
    return this.mapLNBitsInvoiceToPaymentInvoice(lnbitsInvoice);
  }

  async getInvoice(invoiceId: string): Promise<PaymentInvoice> {
    return this.getInvoiceStatus(invoiceId);
  }

  async markInvoiceInvalid(invoiceId: string): Promise<void> {
    // LNBits doesn't have a direct invalidate method, so we'll just log it
    console.log(`Marking LNBits invoice ${invoiceId} as invalid`);
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

  private mapLNBitsInvoiceToPaymentInvoice(lnbitsInvoice: LNBitsInvoice): PaymentInvoice {
    const now = Date.now();
    const isExpired = now > lnbitsInvoice.expiry * 1000;
    const isPaid = lnbitsInvoice.settled;

    let status: 'pending' | 'paid' | 'expired' | 'invalid';
    if (isPaid) {
      status = 'paid';
    } else if (isExpired) {
      status = 'expired';
    } else {
      status = 'pending';
    }

    return {
      id: lnbitsInvoice.payment_hash,
      amount: lnbitsInvoice.amount / 1000, // Convert millisats to USD (approximate)
      currency: 'USD',
      status,
      paymentUrl: lnbitsInvoice.payment_request,
      qrCode: lnbitsInvoice.payment_request,
      btcAmount: lnbitsInvoice.amount,
      expiresAt: new Date(lnbitsInvoice.expiry * 1000),
      createdAt: new Date(lnbitsInvoice.created_at * 1000),
      paidAt: lnbitsInvoice.settled_at ? new Date(lnbitsInvoice.settled_at * 1000) : undefined,
      transactions: lnbitsInvoice.settled ? [{
        id: lnbitsInvoice.payment_hash,
        amount: lnbitsInvoice.amount,
        confirmations: 1,
        txid: lnbitsInvoice.payment_hash,
        timestamp: new Date(lnbitsInvoice.settled_at! * 1000),
      }] : [],
    };
  }
}
