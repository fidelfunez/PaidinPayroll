import { storage } from '../storage';
import { plaidService } from '../services/plaid-service';
import { stripeService } from '../services/stripe-service';
import { strikeService } from '../services/strike-service';
import { breezService } from '../services/breez-service';
import { addFundingJob, addConversionJob, addPayoutJob, addWebhookJob } from '../queues/payment-queue';

export interface FundingRequest {
  companyId: number;
  userId: number;
  amountUsd: number;
  plaidAccountId: number;
  description?: string;
}

export interface SwapRequest {
  companyId: number;
  userId: number;
  direction: 'btc_to_usd' | 'usd_to_btc';
  amount: number;
  description?: string;
}

export interface PayoutRequest {
  companyId: number;
  userId: number;
  amountSats: number;
  description: string;
  walletId?: number;
}

export class PaymentOrchestrator {
  /**
   * Fund company wallet via bank account
   */
  async fundCompanyWallet(request: FundingRequest): Promise<{ paymentIntentId: string; status: string }> {
    try {
      console.log('Initiating company wallet funding:', request);

      // Validate user permissions
      const user = await storage.getUser(request.userId);
      if (!user || user.companyId !== request.companyId) {
        throw new Error('User not found or unauthorized');
      }

      // Validate Plaid account
      const plaidAccount = await storage.getPlaidAccountById(request.plaidAccountId);
      if (!plaidAccount || plaidAccount.companyId !== request.companyId || plaidAccount.userId !== request.userId) {
        throw new Error('Plaid account not found or unauthorized');
      }

      // Get account and routing numbers for ACH
      const authData = await plaidService.getAuth(request.plaidAccountId);

      // Create payment method from Plaid account
      const paymentMethod = await stripeService.createPaymentMethodFromPlaid(
        request.plaidAccountId,
        authData.account,
        authData.routing,
        `${user.firstName} ${user.lastName}`,
        plaidAccount.accountType === 'depository' ? 'checking' : 'savings'
      );

      // Create Stripe payment intent
      const paymentIntent = await stripeService.createPaymentIntent(
        Math.round(request.amountUsd * 100), // Convert to cents
        request.plaidAccountId,
        {
          companyId: request.companyId.toString(),
          userId: request.userId.toString(),
          description: request.description || 'Company wallet funding',
        }
      );

      // Confirm payment intent
      const confirmedIntent = await stripeService.confirmPaymentIntent(
        paymentIntent.stripePaymentIntentId,
        paymentMethod.id
      );

      // Add funding job to queue
      await addFundingJob({
        paymentIntentId: paymentIntent.stripePaymentIntentId,
        companyId: request.companyId,
        userId: request.userId,
        amountUsd: request.amountUsd,
        plaidAccountId: request.plaidAccountId,
      });

      return {
        paymentIntentId: paymentIntent.stripePaymentIntentId,
        status: confirmedIntent.status,
      };
    } catch (error) {
      console.error('Company wallet funding error:', error);
      throw new Error(`Failed to fund company wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process funding completion (triggered by webhook)
   */
  async processFundingCompletion(paymentIntentId: string): Promise<void> {
    try {
      console.log('Processing funding completion:', paymentIntentId);

      // Verify payment succeeded in Stripe
      const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);
      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment intent ${paymentIntentId} not succeeded`);
      }

      // Get payment intent from database
      const dbIntent = await storage.getPaymentIntentByStripeId(paymentIntentId);
      if (!dbIntent) {
        throw new Error('Payment intent not found in database');
      }

      // Create Strike quote for USD to BTC conversion
      const quote = await strikeService.createQuote(dbIntent.amount / 100); // Convert from cents
      
      // Execute the quote
      const executedQuote = await strikeService.executeQuote(quote.quoteId);
      
      // Create conversion record
      const conversion = await storage.createConversion({
        companyId: dbIntent.companyId,
        userId: dbIntent.userId,
        paymentIntentId: dbIntent.id,
        strikeQuoteId: executedQuote.quoteId,
        amountUsd: executedQuote.amountUsd,
        amountBtc: executedQuote.amountBtc,
        exchangeRate: executedQuote.exchangeRate,
        status: 'completed',
        completedAt: new Date(),
        createdAt: new Date(),
      });

      // Generate Breez invoice for company wallet
      const companyWallets = await storage.getBreezWalletsByCompany(dbIntent.companyId);
      let companyWallet = companyWallets.find(w => w.walletType === 'company');
      
      if (!companyWallet) {
        // Create company wallet if it doesn't exist
        companyWallet = await breezService.initializeWallet(0, dbIntent.companyId, 'company');
      }

      const invoice = await breezService.generateInvoice(
        companyWallet.id,
        Math.round(executedQuote.amountBtc * 100000000), // Convert BTC to sats
        `Funding from ${executedQuote.amountUsd} USD`
      );

      // Use Strike to pay the Lightning invoice
      const payment = await strikeService.payInvoice(invoice.invoice, executedQuote.quoteId);

      // Update wallet balance
      await breezService.syncWallet(companyWallet.id);

      // Log transaction
      await storage.createWalletTransaction({
        companyId: dbIntent.companyId,
        userId: dbIntent.userId,
        transactionType: 'funding',
        sourceType: 'stripe',
        sourceId: paymentIntentId,
        amount: executedQuote.amountUsd,
        currency: 'usd',
        status: 'completed',
        metadata: JSON.stringify({
          conversionId: conversion.id,
          strikeQuoteId: executedQuote.quoteId,
          breezInvoiceId: invoice.invoiceId,
          breezPaymentId: payment.paymentId,
        }),
        createdAt: new Date(),
      });

      console.log('Funding completion processed successfully:', paymentIntentId);
    } catch (error) {
      console.error('Funding completion processing error:', error);
      throw error;
    }
  }

  /**
   * Process employee swap (BTC to USD or USD to BTC)
   */
  async processEmployeeSwap(request: SwapRequest): Promise<{ status: string; transactionId?: string }> {
    try {
      console.log('Processing employee swap:', request);

      // Validate user permissions
      const user = await storage.getUser(request.userId);
      if (!user || user.companyId !== request.companyId) {
        throw new Error('User not found or unauthorized');
      }

      if (request.direction === 'btc_to_usd') {
        return await this.processBtcToUsdSwap(request);
      } else {
        return await this.processUsdToBtcSwap(request);
      }
    } catch (error) {
      console.error('Employee swap processing error:', error);
      throw new Error(`Failed to process employee swap: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process BTC to USD swap
   */
  private async processBtcToUsdSwap(request: SwapRequest): Promise<{ status: string; transactionId?: string }> {
    try {
      // Get user's Breez wallet
      const userWallets = await storage.getBreezWalletsByUser(request.userId);
      let userWallet = userWallets.find(w => w.walletType === 'employee');
      
      if (!userWallet) {
        // Create user wallet if it doesn't exist
        userWallet = await breezService.initializeWallet(request.userId, request.companyId, 'employee');
      }

      // Check wallet balance
      const balance = await breezService.getWalletBalance(userWallet.id);
      if (balance < request.amount) {
        throw new Error('Insufficient wallet balance');
      }

      // Generate invoice to receive BTC
      const invoice = await breezService.generateInvoice(
        userWallet.id,
        request.amount,
        request.description || 'BTC to USD swap'
      );

      // Use Strike to swap BTC to USD
      const swap = await strikeService.swapBtcToUsd(request.amount / 100000000); // Convert sats to BTC

      // Log transaction
      await storage.createWalletTransaction({
        companyId: request.companyId,
        userId: request.userId,
        transactionType: 'swap_btc_to_usd',
        sourceType: 'strike',
        sourceId: swap.swapId,
        amount: request.amount,
        currency: 'sats',
        status: swap.status === 'completed' ? 'completed' : 'pending',
        metadata: JSON.stringify({
          swapId: swap.swapId,
          amountUsd: swap.amountUsd,
          exchangeRate: swap.exchangeRate,
          invoice: invoice.invoice,
        }),
        createdAt: new Date(),
      });

      return {
        status: swap.status,
        transactionId: swap.swapId,
      };
    } catch (error) {
      console.error('BTC to USD swap error:', error);
      throw error;
    }
  }

  /**
   * Process USD to BTC swap
   */
  private async processUsdToBtcSwap(request: SwapRequest): Promise<{ status: string; transactionId?: string }> {
    try {
      // Get user's Breez wallet
      const userWallets = await storage.getBreezWalletsByUser(request.userId);
      let userWallet = userWallets.find(w => w.walletType === 'employee');
      
      if (!userWallet) {
        // Create user wallet if it doesn't exist
        userWallet = await breezService.initializeWallet(request.userId, request.companyId, 'employee');
      }

      // Create Strike quote for USD to BTC conversion
      const quote = await strikeService.createQuote(request.amount);
      
      // Execute the quote
      const executedQuote = await strikeService.executeQuote(quote.quoteId);
      
      // Generate Breez invoice for the BTC amount
      const invoice = await breezService.generateInvoice(
        userWallet.id,
        Math.round(executedQuote.amountBtc * 100000000), // Convert BTC to sats
        request.description || 'USD to BTC swap'
      );

      // Use Strike to pay the Lightning invoice
      const payment = await strikeService.payInvoice(invoice.invoice, executedQuote.quoteId);

      // Log transaction
      await storage.createWalletTransaction({
        companyId: request.companyId,
        userId: request.userId,
        transactionType: 'swap_usd_to_btc',
        sourceType: 'strike',
        sourceId: executedQuote.quoteId,
        amount: Math.round(executedQuote.amountBtc * 100000000),
        currency: 'sats',
        status: payment.status === 'completed' ? 'completed' : 'pending',
        metadata: JSON.stringify({
          strikeQuoteId: executedQuote.quoteId,
          amountUsd: executedQuote.amountUsd,
          exchangeRate: executedQuote.exchangeRate,
          breezInvoiceId: invoice.invoiceId,
          breezPaymentId: payment.paymentId,
        }),
        createdAt: new Date(),
      });

      return {
        status: payment.status,
        transactionId: executedQuote.quoteId,
      };
    } catch (error) {
      console.error('USD to BTC swap error:', error);
      throw error;
    }
  }

  /**
   * Process employee payout
   */
  async processEmployeePayout(request: PayoutRequest): Promise<{ status: string; invoiceId?: string }> {
    try {
      console.log('Processing employee payout:', request);

      // Validate user permissions
      const user = await storage.getUser(request.userId);
      if (!user || user.companyId !== request.companyId) {
        throw new Error('User not found or unauthorized');
      }

      // Add payout job to queue
      const job = await addPayoutJob({
        companyId: request.companyId,
        userId: request.userId,
        amountSats: request.amountSats,
        description: request.description,
        walletId: request.walletId,
      });

      return {
        status: 'queued',
        invoiceId: job.id,
      };
    } catch (error) {
      console.error('Employee payout processing error:', error);
      throw new Error(`Failed to process employee payout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentIntentId: string): Promise<{ status: string; details?: any }> {
    try {
      const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);
      if (!paymentIntent) {
        throw new Error('Payment intent not found');
      }

      return {
        status: paymentIntent.status,
        details: {
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          created: paymentIntent.created,
          metadata: paymentIntent.metadata,
        },
      };
    } catch (error) {
      console.error('Payment status retrieval error:', error);
      throw new Error(`Failed to get payment status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get wallet balance for user
   */
  async getWalletBalance(userId: number, companyId: number, walletType: 'company' | 'employee' = 'employee'): Promise<number> {
    try {
      if (walletType === 'company') {
        const companyWallets = await storage.getBreezWalletsByCompany(companyId);
        const companyWallet = companyWallets.find(w => w.walletType === 'company');
        if (!companyWallet) {
          return 0;
        }
        return await breezService.getWalletBalance(companyWallet.id);
      } else {
        const userWallets = await storage.getBreezWalletsByUser(userId);
        const userWallet = userWallets.find(w => w.walletType === 'employee');
        if (!userWallet) {
          return 0;
        }
        return await breezService.getWalletBalance(userWallet.id);
      }
    } catch (error) {
      console.error('Wallet balance retrieval error:', error);
      throw new Error(`Failed to get wallet balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transaction history for user
   */
  async getTransactionHistory(userId: number, companyId: number, limit: number = 50): Promise<any[]> {
    try {
      return await storage.getWalletTransactions(userId, companyId);
    } catch (error) {
      console.error('Transaction history retrieval error:', error);
      throw new Error(`Failed to get transaction history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(provider: 'stripe' | 'strike' | 'breez', eventType: string, eventId: string, payload: any): Promise<void> {
    try {
      console.log('Handling webhook:', provider, eventType, eventId);

      // Add webhook job to queue
      await addWebhookJob({
        provider,
        eventType,
        eventId,
        payload,
      });

      // Handle specific events immediately if needed
      if (provider === 'stripe' && eventType === 'payment_intent.succeeded') {
        await this.processFundingCompletion(payload.id);
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }
}

export const paymentOrchestrator = new PaymentOrchestrator();
