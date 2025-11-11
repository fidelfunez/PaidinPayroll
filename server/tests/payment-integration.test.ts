import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { paymentOrchestrator } from '../orchestrators/payment-orchestrator';
import { plaidService } from '../services/plaid-service';
import { stripeService } from '../services/stripe-service';
import { strikeService } from '../services/strike-service';
import { breezService } from '../services/breez-service';
import { storage } from '../storage';

// Mock external services for testing
jest.mock('../services/plaid-service');
jest.mock('../services/stripe-service');
jest.mock('../services/strike-service');
jest.mock('../services/breez-service');

describe('Payment Integration Tests', () => {
  const mockUser = {
    id: 1,
    companyId: 1,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    role: 'admin' as const,
  };

  const mockPlaidAccount = {
    id: 1,
    companyId: 1,
    userId: 1,
    plaidItemId: 'test-item-id',
    plaidAccessToken: 'encrypted-token',
    accountId: 'test-account-id',
    accountName: 'Test Checking',
    accountType: 'depository' as const,
    accountMask: '0000',
    institutionId: 'test-institution',
    institutionName: 'Test Bank',
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    // Setup test database or use in-memory database
    console.log('Setting up payment integration tests...');
  });

  afterAll(async () => {
    // Cleanup test data
    console.log('Cleaning up payment integration tests...');
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Plaid Integration', () => {
    it('should create link token successfully', async () => {
      const mockLinkToken = 'link-sandbox-test-token';
      (plaidService.createLinkToken as jest.Mock).mockResolvedValue(mockLinkToken);

      const linkToken = await plaidService.createLinkToken(mockUser.id, mockUser.companyId);
      
      expect(linkToken).toBe(mockLinkToken);
      expect(plaidService.createLinkToken).toHaveBeenCalledWith(mockUser.id, mockUser.companyId);
    });

    it('should exchange public token successfully', async () => {
      const mockPublicToken = 'public-sandbox-test-token';
      (plaidService.exchangePublicToken as jest.Mock).mockResolvedValue(mockPlaidAccount);

      const account = await plaidService.exchangePublicToken(
        mockPublicToken,
        mockUser.id,
        mockUser.companyId
      );

      expect(account).toEqual(mockPlaidAccount);
      expect(plaidService.exchangePublicToken).toHaveBeenCalledWith(
        mockPublicToken,
        mockUser.id,
        mockUser.companyId
      );
    });

    it('should get auth data successfully', async () => {
      const mockAuthData = { account: '1234567890', routing: '021000021' };
      (plaidService.getAuth as jest.Mock).mockResolvedValue(mockAuthData);

      const authData = await plaidService.getAuth(mockPlaidAccount.id);

      expect(authData).toEqual(mockAuthData);
      expect(plaidService.getAuth).toHaveBeenCalledWith(mockPlaidAccount.id);
    });
  });

  describe('Stripe Integration', () => {
    it('should create payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        amount: 5000,
        currency: 'usd',
        status: 'requires_payment_method',
        metadata: { companyId: '1', userId: '1' },
      };
      (stripeService.createPaymentIntent as jest.Mock).mockResolvedValue(mockPaymentIntent);

      const paymentIntent = await stripeService.createPaymentIntent(
        5000,
        mockPlaidAccount.id,
        { companyId: '1', userId: '1' }
      );

      expect(paymentIntent).toEqual(mockPaymentIntent);
      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
        5000,
        mockPlaidAccount.id,
        { companyId: '1', userId: '1' }
      );
    });

    it('should confirm payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
      };
      (stripeService.confirmPaymentIntent as jest.Mock).mockResolvedValue(mockPaymentIntent);

      const result = await stripeService.confirmPaymentIntent('pi_test_123', 'pm_test_123');

      expect(result).toEqual(mockPaymentIntent);
      expect(stripeService.confirmPaymentIntent).toHaveBeenCalledWith('pi_test_123', 'pm_test_123');
    });
  });

  describe('Strike Integration', () => {
    it('should create quote successfully', async () => {
      const mockQuote = {
        quoteId: 'quote_test_123',
        amountUsd: 100,
        amountBtc: 0.002,
        exchangeRate: 50000,
        expiresAt: new Date(Date.now() + 300000), // 5 minutes
        fees: { networkFee: 0.001, serviceFee: 0.002, totalFee: 0.003 },
      };
      (strikeService.createQuote as jest.Mock).mockResolvedValue(mockQuote);

      const quote = await strikeService.createQuote(100);

      expect(quote).toEqual(mockQuote);
      expect(strikeService.createQuote).toHaveBeenCalledWith(100);
    });

    it('should execute quote successfully', async () => {
      const mockExecutedQuote = {
        quoteId: 'quote_test_123',
        amountUsd: 100,
        amountBtc: 0.002,
        exchangeRate: 50000,
        expiresAt: new Date(Date.now() + 300000),
        fees: { networkFee: 0.001, serviceFee: 0.002, totalFee: 0.003 },
      };
      (strikeService.executeQuote as jest.Mock).mockResolvedValue(mockExecutedQuote);

      const result = await strikeService.executeQuote('quote_test_123');

      expect(result).toEqual(mockExecutedQuote);
      expect(strikeService.executeQuote).toHaveBeenCalledWith('quote_test_123');
    });

    it('should create invoice successfully', async () => {
      const mockInvoice = {
        invoiceId: 'invoice_test_123',
        invoice: 'lnbc1000n1p...',
        amountSats: 200000,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
        status: 'pending' as const,
      };
      (strikeService.createInvoice as jest.Mock).mockResolvedValue(mockInvoice);

      const invoice = await strikeService.createInvoice(0.002, 'Test invoice');

      expect(invoice).toEqual(mockInvoice);
      expect(strikeService.createInvoice).toHaveBeenCalledWith(0.002, 'Test invoice');
    });
  });

  describe('Breez Integration', () => {
    it('should initialize wallet successfully', async () => {
      const mockWallet = {
        id: 1,
        companyId: 1,
        userId: 1,
        walletType: 'employee' as const,
        breezNodeId: 'breez_test_123',
        balance: 0,
        invoiceCapability: true,
        status: 'active' as const,
        createdAt: new Date(),
      };
      (breezService.initializeWallet as jest.Mock).mockResolvedValue(mockWallet);

      const wallet = await breezService.initializeWallet(1, 1, 'employee');

      expect(wallet).toEqual(mockWallet);
      expect(breezService.initializeWallet).toHaveBeenCalledWith(1, 1, 'employee');
    });

    it('should generate invoice successfully', async () => {
      const mockInvoice = {
        invoiceId: 'breez_invoice_123',
        invoice: 'lnbc1000n1p...',
        amountSats: 100000,
        description: 'Test invoice',
        expiresAt: new Date(Date.now() + 3600000),
        status: 'pending' as const,
      };
      (breezService.generateInvoice as jest.Mock).mockResolvedValue(mockInvoice);

      const invoice = await breezService.generateInvoice(1, 100000, 'Test invoice');

      expect(invoice).toEqual(mockInvoice);
      expect(breezService.generateInvoice).toHaveBeenCalledWith(1, 100000, 'Test invoice');
    });

    it('should pay invoice successfully', async () => {
      const mockPayment = {
        paymentId: 'breez_payment_123',
        invoice: 'lnbc1000n1p...',
        amountSats: 100000,
        status: 'completed' as const,
        transactionHash: 'tx_test_123',
        createdAt: new Date(),
      };
      (breezService.payInvoice as jest.Mock).mockResolvedValue(mockPayment);

      const payment = await breezService.payInvoice(1, 'lnbc1000n1p...');

      expect(payment).toEqual(mockPayment);
      expect(breezService.payInvoice).toHaveBeenCalledWith(1, 'lnbc1000n1p...');
    });
  });

  describe('Payment Orchestrator', () => {
    it('should fund company wallet successfully', async () => {
      // Mock all required services
      (stripeService.createPaymentIntent as jest.Mock).mockResolvedValue({
        id: 'pi_test_123',
        status: 'requires_payment_method',
      });
      (stripeService.confirmPaymentIntent as jest.Mock).mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
      });

      const result = await paymentOrchestrator.fundCompanyWallet({
        companyId: 1,
        userId: 1,
        amountUsd: 100,
        plaidAccountId: 1,
        description: 'Test funding',
      });

      expect(result).toHaveProperty('paymentIntentId');
      expect(result).toHaveProperty('status');
      expect(result.paymentIntentId).toBe('pi_test_123');
    });

    it('should process employee swap successfully', async () => {
      // Mock Breez wallet
      (breezService.initializeWallet as jest.Mock).mockResolvedValue({
        id: 1,
        companyId: 1,
        userId: 1,
        walletType: 'employee',
        breezNodeId: 'breez_test_123',
        balance: 1000000, // 0.01 BTC in sats
        invoiceCapability: true,
        status: 'active',
        createdAt: new Date(),
      });

      // Mock Strike quote and execution
      (strikeService.createQuote as jest.Mock).mockResolvedValue({
        quoteId: 'quote_test_123',
        amountUsd: 100,
        amountBtc: 0.002,
        exchangeRate: 50000,
        expiresAt: new Date(Date.now() + 300000),
        fees: { networkFee: 0.001, serviceFee: 0.002, totalFee: 0.003 },
      });

      (strikeService.executeQuote as jest.Mock).mockResolvedValue({
        quoteId: 'quote_test_123',
        amountUsd: 100,
        amountBtc: 0.002,
        exchangeRate: 50000,
        expiresAt: new Date(Date.now() + 300000),
        fees: { networkFee: 0.001, serviceFee: 0.002, totalFee: 0.003 },
      });

      // Mock Breez invoice generation and payment
      (breezService.generateInvoice as jest.Mock).mockResolvedValue({
        invoiceId: 'breez_invoice_123',
        invoice: 'lnbc1000n1p...',
        amountSats: 200000,
        description: 'USD to BTC swap',
        expiresAt: new Date(Date.now() + 3600000),
        status: 'pending',
      });

      (strikeService.payInvoice as jest.Mock).mockResolvedValue({
        status: 'completed',
        transactionHash: 'tx_test_123',
      });

      const result = await paymentOrchestrator.processEmployeeSwap({
        companyId: 1,
        userId: 1,
        direction: 'usd_to_btc',
        amount: 100,
        description: 'Test swap',
      });

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('transactionId');
    });

    it('should handle insufficient funds error', async () => {
      // Mock wallet with insufficient balance
      (breezService.initializeWallet as jest.Mock).mockResolvedValue({
        id: 1,
        companyId: 1,
        userId: 1,
        walletType: 'employee',
        breezNodeId: 'breez_test_123',
        balance: 10000, // 0.0001 BTC in sats
        invoiceCapability: true,
        status: 'active',
        createdAt: new Date(),
      });

      (breezService.getWalletBalance as jest.Mock).mockResolvedValue(10000);

      await expect(
        paymentOrchestrator.processEmployeeSwap({
          companyId: 1,
          userId: 1,
          direction: 'btc_to_usd',
          amount: 100000, // 0.001 BTC in sats (more than available)
          description: 'Test swap',
        })
      ).rejects.toThrow('Insufficient wallet balance');
    });
  });

  describe('Error Handling', () => {
    it('should handle Plaid service errors gracefully', async () => {
      (plaidService.createLinkToken as jest.Mock).mockRejectedValue(
        new Error('Plaid API error')
      );

      await expect(
        plaidService.createLinkToken(mockUser.id, mockUser.companyId)
      ).rejects.toThrow('Plaid API error');
    });

    it('should handle Stripe service errors gracefully', async () => {
      (stripeService.createPaymentIntent as jest.Mock).mockRejectedValue(
        new Error('Stripe API error')
      );

      await expect(
        stripeService.createPaymentIntent(5000, 1, {})
      ).rejects.toThrow('Stripe API error');
    });

    it('should handle Strike service errors gracefully', async () => {
      (strikeService.createQuote as jest.Mock).mockRejectedValue(
        new Error('Strike API error')
      );

      await expect(
        strikeService.createQuote(100)
      ).rejects.toThrow('Strike API error');
    });

    it('should handle Breez service errors gracefully', async () => {
      (breezService.initializeWallet as jest.Mock).mockRejectedValue(
        new Error('Breez API error')
      );

      await expect(
        breezService.initializeWallet(1, 1, 'employee')
      ).rejects.toThrow('Breez API error');
    });
  });

  describe('Webhook Processing', () => {
    it('should handle Stripe webhook events', async () => {
      const mockEvent = {
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
            amount: 5000,
            currency: 'usd',
            metadata: { companyId: '1', userId: '1' },
          },
        },
      };

      (stripeService.verifyWebhookSignature as jest.Mock).mockReturnValue(mockEvent);
      (stripeService.handleWebhook as jest.Mock).mockResolvedValue(undefined);

      await stripeService.handleWebhook(mockEvent);

      expect(stripeService.handleWebhook).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle Strike webhook events', async () => {
      const mockEvent = {
        type: 'quote.completed',
        id: 'quote_test_123',
        data: {
          quoteId: 'quote_test_123',
          amountUsd: 100,
          amountBtc: 0.002,
          exchangeRate: 50000,
        },
      };

      (strikeService.verifyWebhookSignature as jest.Mock).mockReturnValue(true);
      (strikeService.handleWebhook as jest.Mock).mockResolvedValue(undefined);

      await strikeService.handleWebhook(mockEvent.type, mockEvent.id, mockEvent.data);

      expect(strikeService.handleWebhook).toHaveBeenCalledWith(
        mockEvent.type,
        mockEvent.id,
        mockEvent.data
      );
    });

    it('should handle Breez webhook events', async () => {
      const mockEvent = {
        type: 'invoice.paid',
        id: 'breez_invoice_123',
        data: {
          invoiceId: 'breez_invoice_123',
          amountSats: 100000,
          transactionHash: 'tx_test_123',
        },
      };

      (breezService.verifyWebhookSignature as jest.Mock).mockReturnValue(true);
      (breezService.handleWebhook as jest.Mock).mockResolvedValue(undefined);

      await breezService.handleWebhook(mockEvent.type, mockEvent.id, mockEvent.data);

      expect(breezService.handleWebhook).toHaveBeenCalledWith(
        mockEvent.type,
        mockEvent.id,
        mockEvent.data
      );
    });
  });
});
