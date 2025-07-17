export type PaymentProvider = 'btcpay' | 'lnbits' | 'noop';

export interface PaymentInvoice {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'expired' | 'invalid';
  paymentUrl: string;
  qrCode?: string;
  btcAmount?: number;
  expiresAt: Date;
  createdAt: Date;
  paidAt?: Date;
  transactions?: Array<{
    id: string;
    amount: number;
    confirmations: number;
    txid: string;
    timestamp: Date;
  }>;
}

export interface CreatePaymentRequest {
  amount: number; // Amount in USD
  currency: string; // USD
  description: string;
  orderId?: string;
  customerEmail?: string;
  customerName?: string;
  redirectUrl?: string;
  webhookUrl?: string;
}

export interface PaymentService {
  createInvoice(data: CreatePaymentRequest): Promise<PaymentInvoice>;
  getInvoiceStatus(invoiceId: string): Promise<PaymentInvoice>;
  getInvoice(invoiceId: string): Promise<PaymentInvoice>;
  markInvoiceInvalid(invoiceId: string): Promise<void>;
  isInvoicePaid(invoice: PaymentInvoice): boolean;
  isInvoiceExpired(invoice: PaymentInvoice): boolean;
  isInvoicePending(invoice: PaymentInvoice): boolean;
  getPaymentUrl(invoice: PaymentInvoice): string;
  getQrCode(invoice: PaymentInvoice): string;
} 