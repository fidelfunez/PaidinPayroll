import Stripe from 'stripe';
import { PaymentIntent, InsertPaymentIntent } from '@shared/schema';
import { storage } from '../storage';

export class StripeService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia',
    });
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  }

  /**
   * Create a payment intent for ACH debit
   */
  async createPaymentIntent(
    amount: number, // Amount in cents
    plaidAccountId: number,
    metadata: Record<string, string> = {}
  ): Promise<PaymentIntent> {
    try {
      // Get Plaid account details for ACH
      const plaidAccount = await storage.getPlaidAccountById(plaidAccountId);
      if (!plaidAccount) {
        throw new Error('Plaid account not found');
      }

      // Create Stripe payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        payment_method_types: ['us_bank_account'],
        payment_method_options: {
          us_bank_account: {
            verification_method: 'automatic',
          },
        },
        metadata: {
          plaidAccountId: plaidAccountId.toString(),
          companyId: plaidAccount.companyId.toString(),
          userId: plaidAccount.userId.toString(),
          ...metadata,
        },
        confirmation_method: 'manual',
        confirm: false,
      });

      // Store payment intent in database
      const paymentIntentData: InsertPaymentIntent = {
        companyId: plaidAccount.companyId,
        userId: plaidAccount.userId,
        stripePaymentIntentId: paymentIntent.id,
        amount,
        currency: 'usd',
        status: paymentIntent.status as any,
        plaidAccountId,
        metadata: JSON.stringify(metadata),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const savedIntent = await storage.createPaymentIntent(paymentIntentData);
      return savedIntent;
    } catch (error) {
      console.error('Stripe payment intent creation error:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Confirm a payment intent with ACH payment method
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<PaymentIntent> {
    try {
      // Confirm the payment intent
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      // Update database
      const dbIntent = await storage.getPaymentIntentByStripeId(paymentIntentId);
      if (dbIntent) {
        await storage.updatePaymentIntent(dbIntent.id, {
          status: paymentIntent.status as any,
          updatedAt: new Date(),
        });
      }

      return paymentIntent as any;
    } catch (error) {
      console.error('Stripe payment intent confirmation error:', error);
      throw new Error('Failed to confirm payment intent');
    }
  }

  /**
   * Get payment intent details
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Stripe payment intent retrieval error:', error);
      return null;
    }
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);
      
      // Update database
      const dbIntent = await storage.getPaymentIntentByStripeId(paymentIntentId);
      if (dbIntent) {
        await storage.updatePaymentIntent(dbIntent.id, {
          status: paymentIntent.status as any,
          updatedAt: new Date(),
        });
      }

      return paymentIntent;
    } catch (error) {
      console.error('Stripe payment intent cancellation error:', error);
      throw new Error('Failed to cancel payment intent');
    }
  }

  /**
   * Create a payment method from Plaid account
   */
  async createPaymentMethodFromPlaid(
    plaidAccountId: number,
    accountNumber: string,
    routingNumber: string,
    accountHolderName: string,
    accountType: 'checking' | 'savings'
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'us_bank_account',
        us_bank_account: {
          account_number: accountNumber,
          routing_number: routingNumber,
          account_holder_type: 'individual',
          account_type: accountType,
        },
        billing_details: {
          name: accountHolderName,
        },
      });

      return paymentMethod;
    } catch (error) {
      console.error('Stripe payment method creation error:', error);
      throw new Error('Failed to create payment method from Plaid account');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
      return event;
    } catch (error) {
      console.error('Stripe webhook signature verification error:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Test connection by retrieving account balance
   */
  async testConnection(): Promise<{ success: boolean; mode: 'test' | 'live'; error?: string }> {
    try {
      const balance = await this.stripe.balance.retrieve();
      return {
        success: true,
        mode: balance.livemode ? 'live' : 'test',
      };
    } catch (error: any) {
      return {
        success: false,
        mode: 'test',
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      console.log('Stripe webhook received:', event.type, event.id);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.requires_action':
          await this.handlePaymentIntentRequiresAction(event.data.object as Stripe.PaymentIntent);
          break;
        case 'charge.dispute.created':
          await this.handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
          break;
        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;
        default:
          console.log('Unhandled Stripe webhook event:', event.type);
      }
    } catch (error) {
      console.error('Stripe webhook handling error:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // Update database
      const dbIntent = await storage.getPaymentIntentByStripeId(paymentIntent.id);
      if (dbIntent) {
        await storage.updatePaymentIntent(dbIntent.id, {
          status: paymentIntent.status as any,
          updatedAt: new Date(),
        });

        // Log webhook event
        await storage.createWebhookEvent({
          provider: 'stripe',
          eventType: 'payment_intent.succeeded',
          eventId: paymentIntent.id,
          payload: JSON.stringify(paymentIntent),
          processed: true,
          processedAt: new Date(),
          createdAt: new Date(),
        });

        // TODO: Trigger funding completion workflow
        console.log('Payment succeeded, triggering funding completion for:', paymentIntent.id);
      }
    } catch (error) {
      console.error('Payment intent succeeded handling error:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment intent
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // Update database
      const dbIntent = await storage.getPaymentIntentByStripeId(paymentIntent.id);
      if (dbIntent) {
        await storage.updatePaymentIntent(dbIntent.id, {
          status: paymentIntent.status as any,
          updatedAt: new Date(),
        });

        // Log webhook event
        await storage.createWebhookEvent({
          provider: 'stripe',
          eventType: 'payment_intent.payment_failed',
          eventId: paymentIntent.id,
          payload: JSON.stringify(paymentIntent),
          processed: true,
          processedAt: new Date(),
          createdAt: new Date(),
        });

        console.log('Payment failed for:', paymentIntent.id);
      }
    } catch (error) {
      console.error('Payment intent failed handling error:', error);
      throw error;
    }
  }

  /**
   * Handle canceled payment intent
   */
  private async handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // Update database
      const dbIntent = await storage.getPaymentIntentByStripeId(paymentIntent.id);
      if (dbIntent) {
        await storage.updatePaymentIntent(dbIntent.id, {
          status: paymentIntent.status as any,
          updatedAt: new Date(),
        });

        console.log('Payment canceled for:', paymentIntent.id);
      }
    } catch (error) {
      console.error('Payment intent canceled handling error:', error);
      throw error;
    }
  }

  /**
   * Handle payment intent requiring action
   */
  private async handlePaymentIntentRequiresAction(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // Update database
      const dbIntent = await storage.getPaymentIntentByStripeId(paymentIntent.id);
      if (dbIntent) {
        await storage.updatePaymentIntent(dbIntent.id, {
          status: paymentIntent.status as any,
          updatedAt: new Date(),
        });

        console.log('Payment requires action for:', paymentIntent.id);
      }
    } catch (error) {
      console.error('Payment intent requires action handling error:', error);
      throw error;
    }
  }

  /**
   * Handle charge dispute
   */
  private async handleChargeDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
    try {
      console.log('Charge dispute created:', dispute.id);
      // TODO: Implement dispute handling logic
    } catch (error) {
      console.error('Charge dispute handling error:', error);
      throw error;
    }
  }

  /**
   * Handle charge refund
   */
  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    try {
      console.log('Charge refunded:', charge.id);
      // TODO: Implement refund handling logic
    } catch (error) {
      console.error('Charge refunded handling error:', error);
      throw error;
    }
  }

  /**
   * Create a refund for a charge
   */
  async createRefund(chargeId: string, amount?: number, reason?: string): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        charge: chargeId,
        amount,
        reason: reason as any,
      });

      return refund;
    } catch (error) {
      console.error('Stripe refund creation error:', error);
      throw new Error('Failed to create refund');
    }
  }

  /**
   * Get charge details
   */
  async getCharge(chargeId: string): Promise<Stripe.Charge | null> {
    try {
      const charge = await this.stripe.charges.retrieve(chargeId);
      return charge;
    } catch (error) {
      console.error('Stripe charge retrieval error:', error);
      return null;
    }
  }

  /**
   * List payment intents for a customer
   */
  async listPaymentIntents(
    customerId?: string,
    limit: number = 10,
    startingAfter?: string
  ): Promise<Stripe.PaymentIntent[]> {
    try {
      const params: Stripe.PaymentIntentListParams = {
        limit,
      };

      if (customerId) {
        params.customer = customerId;
      }

      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const paymentIntents = await this.stripe.paymentIntents.list(params);
      return paymentIntents.data;
    } catch (error) {
      console.error('Stripe payment intents list error:', error);
      throw new Error('Failed to list payment intents');
    }
  }
}

export const stripeService = new StripeService();
