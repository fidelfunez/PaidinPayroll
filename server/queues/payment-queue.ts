import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { storage } from '../storage';
import { stripeService } from '../services/stripe-service';
import { strikeService } from '../services/strike-service';
import { breezService } from '../services/breez-service';

// Redis connection for queues (BullMQ requires maxRetriesPerRequest: null)
// Make connection lazy to handle Redis not being available
let connection: IORedis | null = null;
let redisAvailable = false;

function getConnection(): IORedis | null {
  // Only try to create connection if REDIS_URL is explicitly set
  // Otherwise assume Redis is not needed for development
  if (!process.env.REDIS_URL && process.env.NODE_ENV !== 'production') {
    return null;
  }

  if (!connection) {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const isTLS = redisUrl.startsWith('rediss://') || redisUrl.includes('upstash.io');
      
      connection = new IORedis(redisUrl, {
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
        lazyConnect: true, // Don't connect immediately
        retryStrategy: () => null, // Disable retry strategy - fail fast if Redis unavailable
        connectTimeout: 1000, // Quick timeout
        enableOfflineQueue: false, // Don't queue commands when offline
        // TLS configuration for Upstash
        ...(isTLS && {
          tls: {
            rejectUnauthorized: false, // Upstash uses self-signed certificates
          },
        }),
      });

      // Suppress connection errors - they're expected if Redis isn't running
      connection.on('error', () => {
        redisAvailable = false;
      });

      connection.on('connect', () => {
        redisAvailable = true;
      });

      // Silently attempt connection - don't throw if it fails
      connection.connect().catch(() => {
        redisAvailable = false;
      });

    } catch (error) {
      return null;
    }
  }
  
  // Only return connection if Redis is available
  return redisAvailable ? connection : null;
}

// Export getConnection for testing
export { getConnection };

// Queue definitions (lazy initialization)
let _fundingQueue: Queue | null = null;
let _conversionQueue: Queue | null = null;
let _payoutQueue: Queue | null = null;
let _webhookQueue: Queue | null = null;

function getQueue(name: 'funding' | 'conversion' | 'payout' | 'webhook'): Queue | null {
  const conn = getConnection();
  if (!conn) return null;
  
  switch (name) {
    case 'funding':
      if (!_fundingQueue) _fundingQueue = new Queue('funding', { connection: conn });
      return _fundingQueue;
    case 'conversion':
      if (!_conversionQueue) _conversionQueue = new Queue('conversion', { connection: conn });
      return _conversionQueue;
    case 'payout':
      if (!_payoutQueue) _payoutQueue = new Queue('payout', { connection: conn });
      return _payoutQueue;
    case 'webhook':
      if (!_webhookQueue) _webhookQueue = new Queue('webhook', { connection: conn });
      return _webhookQueue;
  }
}

export const fundingQueue = getQueue('funding');
export const conversionQueue = getQueue('conversion');
export const payoutQueue = getQueue('payout');
export const webhookQueue = getQueue('webhook');

// Job types
export interface FundingJobData {
  paymentIntentId: string;
  companyId: number;
  userId: number;
  amountUsd: number;
  plaidAccountId: number;
}

export interface ConversionJobData {
  paymentIntentId: string;
  companyId: number;
  userId: number;
  amountUsd: number;
  amountBtc: number;
  exchangeRate: number;
  strikeQuoteId: string;
}

export interface PayoutJobData {
  companyId: number;
  userId: number;
  amountSats: number;
  description: string;
  walletId?: number;
}

export interface WebhookJobData {
  provider: 'stripe' | 'strike' | 'breez';
  eventType: string;
  eventId: string;
  payload: any;
}

// Queue configuration
const queueConfig = {
  removeOnComplete: 100,
  removeOnFail: 50,
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
};

// Add jobs to queues
export async function addFundingJob(data: FundingJobData): Promise<Job | null> {
  const queue = getQueue('funding');
  if (!queue) {
    console.warn('Queue system not available. Job not queued:', data);
    return null;
  }
  return await queue.add('process-funding', data, {
    ...queueConfig,
    delay: 5000, // 5 second delay to allow Stripe to process
  });
}

export async function addConversionJob(data: ConversionJobData): Promise<Job | null> {
  const queue = getQueue('conversion');
  if (!queue) {
    console.warn('Queue system not available. Job not queued:', data);
    return null;
  }
  return await queue.add('process-conversion', data, queueConfig);
}

export async function addPayoutJob(data: PayoutJobData): Promise<Job | null> {
  const queue = getQueue('payout');
  if (!queue) {
    console.warn('Queue system not available. Job not queued:', data);
    return null;
  }
  return await queue.add('process-payout', data, queueConfig);
}

export async function addWebhookJob(data: WebhookJobData): Promise<Job | null> {
  const queue = getQueue('webhook');
  if (!queue) {
    console.warn('Queue system not available. Job not queued:', data);
    return null;
  }
  return await queue.add('process-webhook', data, {
    ...queueConfig,
    attempts: 5, // More attempts for webhooks
  });
}

// Workers - only initialize if Redis is available
let _fundingWorker: Worker | null = null;
let _conversionWorker: Worker | null = null;
let _payoutWorker: Worker | null = null;
let _webhookWorker: Worker | null = null;

// Initialize workers only if Redis connection is available (called after module load)
// Use a timeout to check Redis availability first
setTimeout(() => {
  try {
    const conn = getConnection();
    if (!conn || !redisAvailable) {
      console.warn('Redis not available. Queue workers disabled. Payment features will work but async queues are disabled.');
      return;
    }
    // Funding queue worker
    _fundingWorker = new Worker(
      'funding',
      async (job: Job<FundingJobData>) => {
        const { paymentIntentId, companyId, userId, amountUsd, plaidAccountId } = job.data;
    
    try {
      console.log('Processing funding job:', paymentIntentId);
      
      // Verify payment succeeded in Stripe
      const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);
      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment intent ${paymentIntentId} not succeeded`);
      }

      // Create Strike quote for USD to BTC conversion
      const quote = await strikeService.createQuote(amountUsd);
      
      // Execute the quote
      const executedQuote = await strikeService.executeQuote(quote.quoteId);
      
      // Create conversion record
      const conversion = await storage.createConversion({
        companyId,
        userId,
        paymentIntentId: paymentIntentId,
        strikeQuoteId: executedQuote.quoteId,
        amountUsd: executedQuote.amountUsd,
        amountBtc: executedQuote.amountBtc,
        exchangeRate: executedQuote.exchangeRate,
        status: 'completed',
        completedAt: new Date(),
        createdAt: new Date(),
      });

      // Generate Breez invoice for company wallet
      const companyWallets = await storage.getBreezWalletsByCompany(companyId);
      let companyWallet = companyWallets.find(w => w.walletType === 'company');
      
      if (!companyWallet) {
        // Create company wallet if it doesn't exist
        companyWallet = await breezService.initializeWallet(0, companyId, 'company');
      }

      const invoice = await breezService.generateInvoice(
        companyWallet.id,
        Math.round(executedQuote.amountBtc * 100000000), // Convert BTC to sats
        `Funding from ${amountUsd} USD`
      );

      // Use Strike to pay the Lightning invoice
      const payment = await strikeService.payInvoice(invoice.invoice, executedQuote.quoteId);

      // Update wallet balance
      await breezService.syncWallet(companyWallet.id);

      // Log transaction
      await storage.createWalletTransaction({
        companyId,
        userId,
        transactionType: 'funding',
        sourceType: 'stripe',
        sourceId: paymentIntentId,
        amount: amountUsd,
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

      console.log('Funding job completed successfully:', paymentIntentId);
      
      // Update job progress
      await job.updateProgress(100);
      
    } catch (error) {
      console.error('Funding job failed:', error);
      
      // Log error transaction
      await storage.createWalletTransaction({
        companyId,
        userId,
        transactionType: 'funding',
        sourceType: 'stripe',
        sourceId: paymentIntentId,
        amount: amountUsd,
        currency: 'usd',
        status: 'failed',
        metadata: JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        createdAt: new Date(),
      });
      
      throw error;
    }
      },
      { connection: conn }
    );

    // Conversion queue worker
    _conversionWorker = new Worker(
  'conversion',
  async (job: Job<ConversionJobData>) => {
    const { paymentIntentId, companyId, userId, amountUsd, amountBtc, exchangeRate, strikeQuoteId } = job.data;
    
    try {
      console.log('Processing conversion job:', strikeQuoteId);
      
      // Check quote status
      const quoteStatus = await strikeService.getQuoteStatus(strikeQuoteId);
      
      if (quoteStatus.status === 'completed') {
        // Update conversion status
        const conversions = await storage.getWebhookEvents('strike', false);
        const conversion = conversions.find(c => 
          c.payload.includes(strikeQuoteId) && c.eventType === 'quote.created'
        );
        
        if (conversion) {
          // Find and update the conversion record
          // This would require additional logic to match quote to conversion
          console.log('Conversion completed:', strikeQuoteId);
        }
      } else if (quoteStatus.status === 'failed') {
        throw new Error(`Quote ${strikeQuoteId} failed`);
      }
      
      console.log('Conversion job completed:', strikeQuoteId);
      
    } catch (error) {
      console.error('Conversion job failed:', error);
      throw error;
    }
      },
      { connection: conn }
    );

    // Payout queue worker
    _payoutWorker = new Worker(
  'payout',
  async (job: Job<PayoutJobData>) => {
    const { companyId, userId, amountSats, description, walletId } = job.data;
    
    try {
      console.log('Processing payout job:', amountSats, 'sats');
      
      // Get user's Breez wallet
      let userWallet;
      if (walletId) {
        userWallet = await storage.getBreezWalletById(walletId);
      } else {
        const userWallets = await storage.getBreezWalletsByUser(userId);
        userWallet = userWallets.find(w => w.walletType === 'employee');
      }
      
      if (!userWallet) {
        // Create user wallet if it doesn't exist
        userWallet = await breezService.initializeWallet(userId, companyId, 'employee');
      }

      // Generate invoice for payout
      const invoice = await breezService.generateInvoice(
        userWallet.id,
        amountSats,
        description
      );

      // Log transaction
      await storage.createWalletTransaction({
        companyId,
        userId,
        transactionType: 'payout',
        sourceType: 'breez',
        sourceId: invoice.invoiceId,
        amount: amountSats,
        currency: 'sats',
        status: 'pending',
        metadata: JSON.stringify({
          description,
          invoice: invoice.invoice,
        }),
        createdAt: new Date(),
      });

      console.log('Payout job completed:', invoice.invoiceId);
      
    } catch (error) {
      console.error('Payout job failed:', error);
      throw error;
    }
      },
      { connection: conn }
    );

    // Webhook queue worker
    _webhookWorker = new Worker(
  'webhook',
  async (job: Job<WebhookJobData>) => {
    const { provider, eventType, eventId, payload } = job.data;
    
    try {
      console.log('Processing webhook job:', provider, eventType, eventId);
      
      // Log webhook event
      await storage.createWebhookEvent({
        provider,
        eventType,
        eventId,
        payload: JSON.stringify(payload),
        processed: false,
        createdAt: new Date(),
      });

      // Process webhook based on provider
      switch (provider) {
        case 'stripe':
          await stripeService.handleWebhook(payload);
          break;
        case 'strike':
          await strikeService.handleWebhook(eventType, payload);
          break;
        case 'breez':
          await breezService.handleWebhook(eventType, payload);
          break;
        default:
          console.log('Unknown webhook provider:', provider);
      }

      // Mark as processed
      const webhookEvents = await storage.getWebhookEvents(provider, false);
      const webhookEvent = webhookEvents.find(e => e.eventId === eventId);
      if (webhookEvent) {
        await storage.updateWebhookEvent(webhookEvent.id, {
          processed: true,
          processedAt: new Date(),
        });
      }

      console.log('Webhook job completed:', eventId);
      
    } catch (error) {
      console.error('Webhook job failed:', error);
      
      // Mark as failed
      const webhookEvents = await storage.getWebhookEvents(provider, false);
      const webhookEvent = webhookEvents.find(e => e.eventId === eventId);
      if (webhookEvent) {
        await storage.updateWebhookEvent(webhookEvent.id, {
          processed: true,
          processedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      throw error;
    }
      },
      { connection: conn }
    );

    // Error handling for workers
    _fundingWorker.on('failed', (job, err) => {
      console.error('Funding worker job failed:', job?.id, err);
    });

    _conversionWorker.on('failed', (job, err) => {
      console.error('Conversion worker job failed:', job?.id, err);
    });

    _payoutWorker.on('failed', (job, err) => {
      console.error('Payout worker job failed:', job?.id, err);
    });

    _webhookWorker.on('failed', (job, err) => {
      console.error('Webhook worker job failed:', job?.id, err);
    });

    console.log('Payment queue system initialized with Redis');
  } catch (error) {
    console.warn('Failed to initialize queue workers:', error);
    console.warn('Queue system disabled. Payment features will work but async queues are disabled.');
  }
}, 1000); // Wait 1 second to check Redis availability

// Export workers (will be null if Redis unavailable)
export const fundingWorker = _fundingWorker;
export const conversionWorker = _conversionWorker;
export const payoutWorker = _payoutWorker;
export const webhookWorker = _webhookWorker;

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down workers...');
  const workers = [_fundingWorker, _conversionWorker, _payoutWorker, _webhookWorker].filter(w => w !== null) as Worker[];
  if (workers.length > 0) {
    await Promise.all(workers.map(w => w.close()));
  }
  const conn = getConnection();
  if (conn) {
    await conn.quit();
  }
  process.exit(0);
});
