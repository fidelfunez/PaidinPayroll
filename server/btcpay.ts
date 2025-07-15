import fetch from 'node-fetch';

interface BTCPayConfig {
  url: string;
  apiKey: string;
  storeId: string;
}

interface CreateInvoiceRequest {
  amount: number; // Amount in USD
  currency: string; // USD
  description: string;
  orderId?: string;
  customerEmail?: string;
  customerName?: string;
  redirectUrl?: string;
  webhookUrl?: string;
}

interface BTCPayInvoice {
  id: string;
  storeId: string;
  amount: number;
  currency: string;
  type: string;
  orderId: string;
  status: string;
  statusMessage: string;
  createdTime: number;
  expirationTime: number;
  monitoringExpiration: number;
  paymentSubtotals: Record<string, number>;
  paymentTotals: Record<string, number>;
  addresses: Record<string, string>;
  paymentUrls: {
    BIP21: string;
    BIP72: string;
    BIP72b: string;
    BIP73: string;
    BIP84: string;
    BIP84b: string;
    LIGHTNING: string;
  };
  supportedTransactionCurrencies: Record<string, {
    enabled: boolean;
    paymentMethods: Record<string, {
      enabled: boolean;
      cryptoCode: string;
      paymentType: string;
      rate: number;
    }>;
  }>;
  metadata: {
    orderId: string;
    customerEmail?: string;
    customerName?: string;
  };
  checkout: {
    speedPolicy: string;
    paymentMethods: string[];
    lazyPaymentMethods: string[];
    defaultPaymentMethod: string;
    paymentMethodFee: Record<string, number>;
    paymentMethodTweaks: Record<string, any>;
    expirationMinutes: number;
    monitoringMinutes: number;
    paymentTolerance: number;
    redirectURL: string;
    redirectAutomatically: boolean;
    requiresRefundEmail: boolean;
    checkoutType: string;
    defaultLanguage: string;
    customCSSLink: string;
    customLogoLink: string;
    customLogoLinkAlt: string;
    embeddedCSS: string;
    notificationUrl: string;
    notificationEmail: string;
    notificationEmailSubject: string;
    redirectAutomatically: boolean;
    requiresRefundEmail: boolean;
    checkoutType: string;
    defaultLanguage: string;
    customCSSLink: string;
    customLogoLink: string;
    customLogoLinkAlt: string;
    embeddedCSS: string;
    notificationUrl: string;
    notificationEmail: string;
    notificationEmailSubject: string;
  };
}

interface BTCPayInvoiceStatus {
  id: string;
  status: string;
  statusMessage: string;
  amount: number;
  currency: string;
  paymentSubtotals: Record<string, number>;
  paymentTotals: Record<string, number>;
  addresses: Record<string, string>;
  paymentUrls: {
    BIP21: string;
    BIP72: string;
    BIP72b: string;
    BIP73: string;
    BIP84: string;
    BIP84b: string;
    LIGHTNING: string;
  };
  transactions: Array<{
    id: string;
    amount: number;
    currency: string;
    confirmations: number;
    blockHeight: number;
    blockHash: string;
    txid: string;
    timestamp: number;
    status: string;
  }>;
}

class BTCPayService {
  private config: BTCPayConfig;

  constructor() {
    this.config = {
      url: process.env.BTCPAY_URL || '',
      apiKey: process.env.BTCPAY_API_KEY || '',
      storeId: process.env.BTCPAY_STORE_ID || ''
    };
  }

  private checkConfiguration() {
    if (!this.config.url || !this.config.apiKey || !this.config.storeId) {
      throw new Error('BTCPay configuration is missing. Please set BTCPAY_URL, BTCPAY_API_KEY, and BTCPAY_STORE_ID environment variables.');
    }
  }

  private async makeRequest(endpoint: string, options: any = {}): Promise<any> {
    this.checkConfiguration();
    
    const url = `${this.config.url}/api/v1/stores/${this.config.storeId}${endpoint}`;
    const headers = {
      'Authorization': `token ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`BTCPay API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // Create a new Bitcoin invoice
  async createInvoice(request: CreateInvoiceRequest): Promise<BTCPayInvoice> {
    const invoiceData = {
      amount: request.amount,
      currency: request.currency,
      description: request.description,
      orderId: request.orderId || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerEmail: request.customerEmail,
      customerName: request.customerName,
      redirectUrl: request.redirectUrl,
      webhookUrl: request.webhookUrl,
      // Enable both on-chain and Lightning payments
      supportedTransactionCurrencies: {
        BTC: {
          enabled: true,
          paymentMethods: {
            BTC_LightningLike: {
              enabled: true,
              cryptoCode: 'BTC',
              paymentType: 'LightningLike',
              rate: 1
            },
            BTC_OnChain: {
              enabled: true,
              cryptoCode: 'BTC',
              paymentType: 'OnChain',
              rate: 1
            }
          }
        }
      }
    };

    return this.makeRequest('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData)
    });
  }

  // Get invoice status
  async getInvoiceStatus(invoiceId: string): Promise<BTCPayInvoiceStatus> {
    return this.makeRequest(`/invoices/${invoiceId}`);
  }

  // Get invoice by ID
  async getInvoice(invoiceId: string): Promise<BTCPayInvoice> {
    return this.makeRequest(`/invoices/${invoiceId}`);
  }

  // Mark invoice as invalid
  async markInvoiceInvalid(invoiceId: string): Promise<void> {
    await this.makeRequest(`/invoices/${invoiceId}`, {
      method: 'DELETE'
    });
  }

  // Get store information
  async getStoreInfo(): Promise<any> {
    return this.makeRequest('');
  }

  // Get payment methods
  async getPaymentMethods(): Promise<any> {
    return this.makeRequest('/payment-methods');
  }

  // Validate invoice status
  isInvoicePaid(invoice: BTCPayInvoice | BTCPayInvoiceStatus): boolean {
    return invoice.status === 'Settled' || invoice.status === 'Complete';
  }

  isInvoiceExpired(invoice: BTCPayInvoice | BTCPayInvoiceStatus): boolean {
    return invoice.status === 'Expired' || invoice.status === 'Invalid';
  }

  isInvoicePending(invoice: BTCPayInvoice | BTCPayInvoiceStatus): boolean {
    return invoice.status === 'New' || invoice.status === 'Processing';
  }

  // Get payment URL for invoice
  getPaymentUrl(invoice: BTCPayInvoice | BTCPayInvoiceStatus, method: 'BIP21' | 'LIGHTNING' = 'BIP21'): string {
    return invoice.paymentUrls[method];
  }

  // Get total amount paid
  getTotalPaid(invoice: BTCPayInvoiceStatus): number {
    return Object.values(invoice.paymentTotals).reduce((sum, amount) => sum + amount, 0);
  }

  // Check if invoice has Lightning payments
  hasLightningPayments(invoice: BTCPayInvoiceStatus): boolean {
    return invoice.transactions.some(tx => tx.status === 'LightningLike');
  }

  // Check if invoice has on-chain payments
  hasOnChainPayments(invoice: BTCPayInvoiceStatus): boolean {
    return invoice.transactions.some(tx => tx.status === 'OnChain');
  }
}

export const btcpayService = new BTCPayService();
export { BTCPayService, CreateInvoiceRequest, BTCPayInvoice, BTCPayInvoiceStatus }; 