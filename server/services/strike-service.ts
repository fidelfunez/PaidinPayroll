import { Conversion, InsertConversion } from '@shared/schema';
import { storage } from '../storage';

interface StrikeQuote {
  quoteId: string;
  amountUsd: number;
  amountBtc: number;
  exchangeRate: number;
  expiresAt: Date;
  fees: {
    networkFee: number;
    serviceFee: number;
    totalFee: number;
  };
}

interface StrikeInvoice {
  invoiceId: string;
  invoice: string;
  amountSats: number;
  expiresAt: Date;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
}

interface StrikeSwap {
  swapId: string;
  amountBtc: number;
  amountUsd: number;
  exchangeRate: number;
  status: 'pending' | 'completed' | 'failed';
  transactionHash?: string;
}

export class StrikeService {
  private apiKey: string;
  private baseUrl: string;
  private webhookSecret: string;

  constructor() {
    this.apiKey = process.env.STRIKE_API_KEY!;
    this.baseUrl = process.env.STRIKE_BASE_URL || 'https://api.strike.me';
    this.webhookSecret = process.env.STRIKE_WEBHOOK_SECRET!;
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'PaidIn/1.0',
    };
  }

  /**
   * Make API request with error handling and retries
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    retries: number = 3
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: this.getHeaders(),
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Strike API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error(`Strike API request attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error('All retry attempts failed');
  }

  /**
   * Create a quote for USD to BTC conversion
   */
  async createQuote(amountUsd: number, currency: string = 'USD'): Promise<StrikeQuote> {
    try {
      const response = await this.makeRequest<{
        quoteId: string;
        amountUsd: number;
        amountBtc: number;
        exchangeRate: number;
        expiresAt: string;
        fees: {
          networkFee: number;
          serviceFee: number;
          totalFee: number;
        };
      }>('/v1/quotes', 'POST', {
        amount: amountUsd,
        currency,
        type: 'usd_to_btc',
      });

      return {
        quoteId: response.quoteId,
        amountUsd: response.amountUsd,
        amountBtc: response.amountBtc,
        exchangeRate: response.exchangeRate,
        expiresAt: new Date(response.expiresAt),
        fees: response.fees,
      };
    } catch (error) {
      console.error('Strike quote creation error:', error);
      throw new Error('Failed to create Strike quote');
    }
  }

  /**
   * Execute a quote to convert USD to BTC
   */
  async executeQuote(quoteId: string): Promise<StrikeQuote> {
    try {
      const response = await this.makeRequest<{
        quoteId: string;
        amountUsd: number;
        amountBtc: number;
        exchangeRate: number;
        expiresAt: string;
        fees: {
          networkFee: number;
          serviceFee: number;
          totalFee: number;
        };
        status: 'executing' | 'completed' | 'failed';
      }>(`/v1/quotes/${quoteId}/execute`, 'POST');

      return {
        quoteId: response.quoteId,
        amountUsd: response.amountUsd,
        amountBtc: response.amountBtc,
        exchangeRate: response.exchangeRate,
        expiresAt: new Date(response.expiresAt),
        fees: response.fees,
      };
    } catch (error) {
      console.error('Strike quote execution error:', error);
      throw new Error('Failed to execute Strike quote');
    }
  }

  /**
   * Get quote status
   */
  async getQuoteStatus(quoteId: string): Promise<StrikeQuote & { status: string }> {
    try {
      const response = await this.makeRequest<{
        quoteId: string;
        amountUsd: number;
        amountBtc: number;
        exchangeRate: number;
        expiresAt: string;
        fees: {
          networkFee: number;
          serviceFee: number;
          totalFee: number;
        };
        status: 'pending' | 'executing' | 'completed' | 'failed' | 'expired';
      }>(`/v1/quotes/${quoteId}`);

      return {
        quoteId: response.quoteId,
        amountUsd: response.amountUsd,
        amountBtc: response.amountBtc,
        exchangeRate: response.exchangeRate,
        expiresAt: new Date(response.expiresAt),
        fees: response.fees,
        status: response.status,
      };
    } catch (error) {
      console.error('Strike quote status error:', error);
      throw new Error('Failed to get quote status');
    }
  }

  /**
   * Create a Lightning invoice for BTC payment
   */
  async createInvoice(amountBtc: number, description: string): Promise<StrikeInvoice> {
    try {
      const response = await this.makeRequest<{
        invoiceId: string;
        invoice: string;
        amountSats: number;
        expiresAt: string;
        status: 'pending';
      }>('/v1/invoices', 'POST', {
        amount: amountBtc,
        currency: 'BTC',
        description,
        type: 'lightning',
      });

      return {
        invoiceId: response.invoiceId,
        invoice: response.invoice,
        amountSats: response.amountSats,
        expiresAt: new Date(response.expiresAt),
        status: response.status,
      };
    } catch (error) {
      console.error('Strike invoice creation error:', error);
      throw new Error('Failed to create Strike invoice');
    }
  }

  /**
   * Pay a Lightning invoice using Strike
   */
  async payInvoice(invoice: string, quoteId?: string): Promise<{ status: string; transactionHash?: string }> {
    try {
      const response = await this.makeRequest<{
        status: 'pending' | 'completed' | 'failed';
        transactionHash?: string;
      }>('/v1/payments', 'POST', {
        invoice,
        quoteId,
      });

      return response;
    } catch (error) {
      console.error('Strike invoice payment error:', error);
      throw new Error('Failed to pay Strike invoice');
    }
  }

  /**
   * Get invoice status
   */
  async getInvoiceStatus(invoiceId: string): Promise<StrikeInvoice> {
    try {
      const response = await this.makeRequest<{
        invoiceId: string;
        invoice: string;
        amountSats: number;
        expiresAt: string;
        status: 'pending' | 'paid' | 'expired' | 'cancelled';
      }>(`/v1/invoices/${invoiceId}`);

      return {
        invoiceId: response.invoiceId,
        invoice: response.invoice,
        amountSats: response.amountSats,
        expiresAt: new Date(response.expiresAt),
        status: response.status,
      };
    } catch (error) {
      console.error('Strike invoice status error:', error);
      throw new Error('Failed to get invoice status');
    }
  }

  /**
   * Swap BTC to USD
   */
  async swapBtcToUsd(amountBtc: number): Promise<StrikeSwap> {
    try {
      const response = await this.makeRequest<{
        swapId: string;
        amountBtc: number;
        amountUsd: number;
        exchangeRate: number;
        status: 'pending' | 'completed' | 'failed';
        transactionHash?: string;
      }>('/v1/swaps', 'POST', {
        amount: amountBtc,
        fromCurrency: 'BTC',
        toCurrency: 'USD',
      });

      return {
        swapId: response.swapId,
        amountBtc: response.amountBtc,
        amountUsd: response.amountUsd,
        exchangeRate: response.exchangeRate,
        status: response.status,
        transactionHash: response.transactionHash,
      };
    } catch (error) {
      console.error('Strike BTC to USD swap error:', error);
      throw new Error('Failed to swap BTC to USD');
    }
  }

  /**
   * Get swap status
   */
  async getSwapStatus(swapId: string): Promise<StrikeSwap> {
    try {
      const response = await this.makeRequest<{
        swapId: string;
        amountBtc: number;
        amountUsd: number;
        exchangeRate: number;
        status: 'pending' | 'completed' | 'failed';
        transactionHash?: string;
      }>(`/v1/swaps/${swapId}`);

      return {
        swapId: response.swapId,
        amountBtc: response.amountBtc,
        amountUsd: response.amountUsd,
        exchangeRate: response.exchangeRate,
        status: response.status,
        transactionHash: response.transactionHash,
      };
    } catch (error) {
      console.error('Strike swap status error:', error);
      throw new Error('Failed to get swap status');
    }
  }

  /**
   * Get current exchange rate
   */
  async getExchangeRate(fromCurrency: string = 'USD', toCurrency: string = 'BTC'): Promise<number> {
    try {
      const response = await this.makeRequest<{
        rate: number;
        timestamp: string;
      }>(`/v1/rates/${fromCurrency}/${toCurrency}`);

      return response.rate;
    } catch (error) {
      console.error('Strike exchange rate error:', error);
      throw new Error('Failed to get exchange rate');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      // Simple signature verification - in production, use proper HMAC verification
      const expectedSignature = this.webhookSecret;
      return signature === expectedSignature;
    } catch (error) {
      console.error('Strike webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(eventType: string, payload: any): Promise<void> {
    try {
      console.log('Strike webhook received:', eventType, payload);

      switch (eventType) {
        case 'quote.completed':
          await this.handleQuoteCompleted(payload);
          break;
        case 'quote.failed':
          await this.handleQuoteFailed(payload);
          break;
        case 'invoice.paid':
          await this.handleInvoicePaid(payload);
          break;
        case 'invoice.expired':
          await this.handleInvoiceExpired(payload);
          break;
        case 'swap.completed':
          await this.handleSwapCompleted(payload);
          break;
        case 'swap.failed':
          await this.handleSwapFailed(payload);
          break;
        default:
          console.log('Unhandled Strike webhook event:', eventType);
      }
    } catch (error) {
      console.error('Strike webhook handling error:', error);
      throw error;
    }
  }

  /**
   * Handle quote completion
   */
  private async handleQuoteCompleted(payload: any): Promise<void> {
    try {
      const { quoteId, amountUsd, amountBtc, exchangeRate } = payload;
      
      // Update conversion status in database
      const conversions = await storage.getWebhookEvents('strike', false);
      const conversion = conversions.find(c => 
        c.payload.includes(quoteId) && c.eventType === 'quote.created'
      );

      if (conversion) {
        // Find the conversion record and update it
        // This would require additional logic to match quote to conversion
        console.log('Quote completed, updating conversion:', quoteId);
      }

      // Log webhook event
      await storage.createWebhookEvent({
        provider: 'strike',
        eventType: 'quote.completed',
        eventId: quoteId,
        payload: JSON.stringify(payload),
        processed: true,
        processedAt: new Date(),
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Quote completed handling error:', error);
      throw error;
    }
  }

  /**
   * Handle quote failure
   */
  private async handleQuoteFailed(payload: any): Promise<void> {
    try {
      const { quoteId, error } = payload;
      console.log('Quote failed:', quoteId, error);

      // Log webhook event
      await storage.createWebhookEvent({
        provider: 'strike',
        eventType: 'quote.failed',
        eventId: quoteId,
        payload: JSON.stringify(payload),
        processed: true,
        processedAt: new Date(),
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Quote failed handling error:', error);
      throw error;
    }
  }

  /**
   * Handle invoice payment
   */
  private async handleInvoicePaid(payload: any): Promise<void> {
    try {
      const { invoiceId, transactionHash } = payload;
      console.log('Invoice paid:', invoiceId, transactionHash);

      // Log webhook event
      await storage.createWebhookEvent({
        provider: 'strike',
        eventType: 'invoice.paid',
        eventId: invoiceId,
        payload: JSON.stringify(payload),
        processed: true,
        processedAt: new Date(),
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Invoice paid handling error:', error);
      throw error;
    }
  }

  /**
   * Handle invoice expiration
   */
  private async handleInvoiceExpired(payload: any): Promise<void> {
    try {
      const { invoiceId } = payload;
      console.log('Invoice expired:', invoiceId);

      // Log webhook event
      await storage.createWebhookEvent({
        provider: 'strike',
        eventType: 'invoice.expired',
        eventId: invoiceId,
        payload: JSON.stringify(payload),
        processed: true,
        processedAt: new Date(),
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Invoice expired handling error:', error);
      throw error;
    }
  }

  /**
   * Handle swap completion
   */
  private async handleSwapCompleted(payload: any): Promise<void> {
    try {
      const { swapId, transactionHash } = payload;
      console.log('Swap completed:', swapId, transactionHash);

      // Log webhook event
      await storage.createWebhookEvent({
        provider: 'strike',
        eventType: 'swap.completed',
        eventId: swapId,
        payload: JSON.stringify(payload),
        processed: true,
        processedAt: new Date(),
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Swap completed handling error:', error);
      throw error;
    }
  }

  /**
   * Handle swap failure
   */
  private async handleSwapFailed(payload: any): Promise<void> {
    try {
      const { swapId, error } = payload;
      console.log('Swap failed:', swapId, error);

      // Log webhook event
      await storage.createWebhookEvent({
        provider: 'strike',
        eventType: 'swap.failed',
        eventId: swapId,
        payload: JSON.stringify(payload),
        processed: true,
        processedAt: new Date(),
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Swap failed handling error:', error);
      throw error;
    }
  }
}

export const strikeService = new StrikeService();
