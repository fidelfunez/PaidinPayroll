import { PaymentService, PaymentProvider } from './types';
import { BTCPayPaymentProvider } from './btcpay-provider';
import { LNBitsPaymentProvider } from './lnbits-provider';

export class PaymentProviderFactory {
  static createProvider(type: PaymentProvider, config: any): PaymentService {
    switch (type) {
      case 'btcpay':
        return new BTCPayPaymentProvider(config);
      case 'lnbits':
        return new LNBitsPaymentProvider({
          baseUrl: process.env.LNBITS_BASE_URL || '',
          apiKey: process.env.LNBITS_API_KEY || '',
          adminKey: process.env.LNBITS_ADMIN_KEY || '',
          walletId: process.env.LNBITS_WALLET_ID || '',
        });
      case 'noop':
        throw new Error('Noop provider not implemented yet');
      default:
        throw new Error(`Unknown payment provider: ${type}`);
    }
  }

  // Helper method to get the default provider (LNBits since BTCPay isn't configured)
  static getDefaultProvider(): PaymentService {
    return this.createProvider('lnbits', {});
  }
}
