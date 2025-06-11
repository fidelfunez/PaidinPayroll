import fetch from 'node-fetch';

interface LNbitsConfig {
  baseUrl: string;
  apiKey: string;
  adminKey: string;
}

interface PaymentRequest {
  amount: number; // Amount in satoshis
  memo: string;
  description?: string;
}

interface PaymentResponse {
  payment_hash: string;
  payment_request: string;
  checking_id: string;
  lnurl_response?: any;
}

interface PaymentStatus {
  paid: boolean;
  checking_id: string;
  amount: number;
  fee: number;
  memo: string;
  time: number;
}

class LNbitsService {
  private config: LNbitsConfig;

  constructor() {
    this.config = {
      baseUrl: process.env.LNBITS_BASE_URL || '',
      apiKey: process.env.LNBITS_API_KEY || '',
      adminKey: process.env.LNBITS_ADMIN_KEY || ''
    };

    if (!this.config.baseUrl || !this.config.apiKey) {
      throw new Error('LNbits configuration is missing. Please set LNBITS_BASE_URL and LNBITS_API_KEY environment variables.');
    }
  }

  private async makeRequest(endpoint: string, options: any = {}) {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = {
      'X-Api-Key': this.config.apiKey,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`LNbits API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Check wallet balance
  async getWalletBalance(): Promise<{ balance: number }> {
    return this.makeRequest('/api/v1/wallet');
  }

  // Create a payment (send money)
  async createPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    return this.makeRequest('/api/v1/payments', {
      method: 'POST',
      body: JSON.stringify({
        out: true,
        bolt11: paymentRequest.description, // This should be a lightning invoice
        memo: paymentRequest.memo
      })
    });
  }

  // Pay a Lightning invoice
  async payInvoice(bolt11: string, memo: string): Promise<PaymentResponse> {
    return this.makeRequest('/api/v1/payments', {
      method: 'POST',
      body: JSON.stringify({
        out: true,
        bolt11: bolt11,
        memo: memo
      })
    });
  }

  // Create an invoice (receive money)
  async createInvoice(amount: number, memo: string, description?: string): Promise<PaymentResponse> {
    return this.makeRequest('/api/v1/payments', {
      method: 'POST',
      body: JSON.stringify({
        out: false,
        amount: amount,
        memo: memo,
        description_hash: description
      })
    });
  }

  // Check payment status
  async getPaymentStatus(checkingId: string): Promise<PaymentStatus> {
    return this.makeRequest(`/api/v1/payments/${checkingId}`);
  }

  // Send payment to Lightning address (user@domain.com format)
  async payToLightningAddress(lightningAddress: string, amountSats: number, memo: string): Promise<PaymentResponse> {
    try {
      // Parse lightning address
      const [username, domain] = lightningAddress.split('@');
      if (!username || !domain) {
        throw new Error('Invalid Lightning address format');
      }

      // Get LNURL-pay endpoint
      const lnurlPayUrl = `https://${domain}/.well-known/lnurlp/${username}`;
      const lnurlResponse = await fetch(lnurlPayUrl);
      
      if (!lnurlResponse.ok) {
        throw new Error('Failed to fetch LNURL-pay endpoint');
      }

      const lnurlData = await lnurlResponse.json();
      
      // Convert sats to millisats for LNURL
      const amountMsat = amountSats * 1000;
      
      // Check if amount is within limits
      if (amountMsat < lnurlData.minSendable || amountMsat > lnurlData.maxSendable) {
        throw new Error(`Amount ${amountSats} sats is outside allowed range`);
      }

      // Request invoice from LNURL callback
      const callbackUrl = `${lnurlData.callback}?amount=${amountMsat}&comment=${encodeURIComponent(memo)}`;
      const invoiceResponse = await fetch(callbackUrl);
      
      if (!invoiceResponse.ok) {
        throw new Error('Failed to get invoice from LNURL callback');
      }

      const invoiceData = await invoiceResponse.json();
      
      if (invoiceData.status === 'ERROR') {
        throw new Error(invoiceData.reason || 'LNURL callback returned error');
      }

      // Pay the invoice
      return this.payInvoice(invoiceData.pr, memo);
      
    } catch (error) {
      throw new Error(`Lightning address payment failed: ${error.message}`);
    }
  }

  // Send payment to Bitcoin address (on-chain)
  async payToBitcoinAddress(address: string, amountSats: number, memo: string): Promise<any> {
    // This would require additional LNbits extensions for on-chain payments
    // For now, we'll throw an error suggesting Lightning payments
    throw new Error('On-chain Bitcoin payments not yet supported. Please use Lightning address or invoice.');
  }

  // Validate Lightning address format
  isValidLightningAddress(address: string): boolean {
    const lightningAddressRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return lightningAddressRegex.test(address);
  }

  // Validate Bitcoin address format (basic check)
  isValidBitcoinAddress(address: string): boolean {
    // Basic Bitcoin address validation (simplified)
    const btcAddressRegex = /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/;
    return btcAddressRegex.test(address);
  }

  // Convert USD to satoshis using current BTC rate
  usdToSatoshis(usdAmount: number, btcRateUsd: number): number {
    const btcAmount = usdAmount / btcRateUsd;
    return Math.round(btcAmount * 100000000); // Convert to satoshis
  }

  // Convert satoshis to USD using current BTC rate
  satoshisToUsd(satoshis: number, btcRateUsd: number): number {
    const btcAmount = satoshis / 100000000;
    return btcAmount * btcRateUsd;
  }
}

export const lnbitsService = new LNbitsService();
export { LNbitsService, PaymentRequest, PaymentResponse, PaymentStatus };