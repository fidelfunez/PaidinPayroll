import { PaymentService, PaymentProvider } from './types';
import { BTCPayPaymentProvider } from './btcpay-provider';

export class PaymentProviderFactory {
  static createProvider(provider: PaymentProvider, config: any): PaymentService {
    switch (provider) {
      case 'btcpay':
        return new BTCPayPaymentProvider(config);
      case 'lnbits':
        throw new Error('LNbits provider not implemented yet');
      case 'noop':
        throw new Error('Noop provider not implemented yet');
      default:
        throw new Error(`Unknown payment provider: ${provider}`);
    }
  }
} 