import type { Express } from "express";
import { requireSuperAdmin } from "../../auth";
import { storage } from "../../storage";
import { stripeService } from "../../services/stripe-service";
import { strikeService } from "../../services/strike-service";
import { breezService } from "../../services/breez-service";
import { addFundingJob, addConversionJob, addPayoutJob, getConnection } from "../../queues/payment-queue";
import { paymentMonitor } from "../../utils/monitoring";

export function registerPaymentAdminRoutes(app: Express): void {
  // Get all payments (super admin only)
  app.get('/api/admin/payments', requireSuperAdmin, async (req, res) => {
    try {
      const { status, limit = 50, offset = 0 } = req.query;
      
      // Get payment intents from database
      const webhookEvents = await storage.getWebhookEvents('stripe', undefined);
      const payments = webhookEvents
        .filter(event => event.eventType.includes('payment_intent'))
        .slice(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string));

      res.json({
        payments: payments.map(event => ({
          id: event.id,
          eventType: event.eventType,
          eventId: event.eventId,
          processed: event.processed,
          processedAt: event.processedAt,
          createdAt: event.createdAt,
          error: event.error,
        })),
        total: payments.length,
      });
    } catch (error) {
      console.error('Admin payments error:', error);
      res.status(500).json({ error: 'Failed to retrieve payments' });
    }
  });

  // Get payment details
  app.get('/api/admin/payments/:id', requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const eventId = parseInt(id);

      const event = await storage.getWebhookEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Payment event not found' });
      }

      // Get additional details from Stripe if it's a payment intent event
      let stripeDetails = null;
      if (event.provider === 'stripe' && event.eventType.includes('payment_intent')) {
        try {
          const paymentIntent = await stripeService.getPaymentIntent(event.eventId);
          stripeDetails = paymentIntent;
        } catch (error) {
          console.error('Failed to fetch Stripe details:', error);
        }
      }

      res.json({
        event: {
          id: event.id,
          provider: event.provider,
          eventType: event.eventType,
          eventId: event.eventId,
          payload: JSON.parse(event.payload),
          processed: event.processed,
          processedAt: event.processedAt,
          createdAt: event.createdAt,
          error: event.error,
        },
        stripeDetails,
      });
    } catch (error) {
      console.error('Admin payment details error:', error);
      res.status(500).json({ error: 'Failed to retrieve payment details' });
    }
  });

  // Retry failed payment
  app.post('/api/admin/payments/:id/retry', requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const eventId = parseInt(id);

      const event = await storage.getWebhookEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Payment event not found' });
      }

      // Retry based on event type
      let job;
      const payload = JSON.parse(event.payload);

      switch (event.eventType) {
        case 'payment_intent.succeeded':
          // Retry funding job
          job = await addFundingJob({
            paymentIntentId: payload.id,
            companyId: parseInt(payload.metadata?.companyId || '0'),
            userId: parseInt(payload.metadata?.userId || '0'),
            amountUsd: payload.amount / 100,
            plaidAccountId: parseInt(payload.metadata?.plaidAccountId || '0'),
          });
          break;
        case 'quote.completed':
          // Retry conversion job
          job = await addConversionJob({
            paymentIntentId: payload.paymentIntentId,
            companyId: parseInt(payload.metadata?.companyId || '0'),
            userId: parseInt(payload.metadata?.userId || '0'),
            amountUsd: payload.amountUsd,
            amountBtc: payload.amountBtc,
            exchangeRate: payload.exchangeRate,
            strikeQuoteId: payload.quoteId,
          });
          break;
        default:
          return res.status(400).json({ error: 'Cannot retry this event type' });
      }

      res.json({
        message: 'Payment retry initiated',
        jobId: job.id,
      });
    } catch (error) {
      console.error('Admin payment retry error:', error);
      res.status(500).json({ error: 'Failed to retry payment' });
    }
  });

  // Get webhook event logs
  app.get('/api/admin/webhooks', requireSuperAdmin, async (req, res) => {
    try {
      const { provider, processed, limit = 100, offset = 0 } = req.query;
      
      const events = await storage.getWebhookEvents(
        provider as string,
        processed ? processed === 'true' : undefined
      );

      const paginatedEvents = events.slice(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string)
      );

      res.json({
        events: paginatedEvents.map(event => ({
          id: event.id,
          provider: event.provider,
          eventType: event.eventType,
          eventId: event.eventId,
          processed: event.processed,
          processedAt: event.processedAt,
          createdAt: event.createdAt,
          error: event.error,
        })),
        total: events.length,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: events.length > parseInt(offset as string) + parseInt(limit as string),
        },
      });
    } catch (error) {
      console.error('Admin webhooks error:', error);
      res.status(500).json({ error: 'Failed to retrieve webhook events' });
    }
  });

  // Replay webhook event
  app.post('/api/admin/webhooks/:id/replay', requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const eventId = parseInt(id);

      const event = await storage.getWebhookEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Webhook event not found' });
      }

      // Replay the webhook event
      const payload = JSON.parse(event.payload);
      
      switch (event.provider) {
        case 'stripe':
          await stripeService.handleWebhook(payload);
          break;
        case 'strike':
          await strikeService.handleWebhook(event.eventType, payload);
          break;
        case 'breez':
          await breezService.handleWebhook(event.eventType, payload);
          break;
        default:
          return res.status(400).json({ error: 'Unknown webhook provider' });
      }

      // Mark as processed
      await storage.updateWebhookEvent(eventId, {
        processed: true,
        processedAt: new Date(),
      });

      res.json({ message: 'Webhook event replayed successfully' });
    } catch (error) {
      console.error('Admin webhook replay error:', error);
      res.status(500).json({ error: 'Failed to replay webhook event' });
    }
  });

  // Get payment system health
  app.get('/api/admin/payments/health', requireSuperAdmin, async (req, res) => {
    try {
      // Check recent webhook events
      const recentEvents = await storage.getWebhookEvents(undefined, undefined);
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentEventsCount = recentEvents.filter(event => 
        new Date(event.createdAt) > last24Hours
      ).length;

      // Check failed events
      const failedEvents = recentEvents.filter(event => 
        event.error && new Date(event.createdAt) > last24Hours
      ).length;

      // Check unprocessed events
      const unprocessedEvents = recentEvents.filter(event => 
        !event.processed && new Date(event.createdAt) > last24Hours
      ).length;

      // Get wallet statistics
      const allWallets = await storage.getWebhookEvents('breez', undefined);
      const activeWallets = allWallets.filter(wallet => 
        wallet.eventType === 'wallet.synced' && new Date(wallet.createdAt) > last24Hours
      ).length;

      res.json({
        health: {
          status: failedEvents === 0 && unprocessedEvents < 10 ? 'healthy' : 'degraded',
          last24Hours: {
            totalEvents: recentEventsCount,
            failedEvents,
            unprocessedEvents,
            activeWallets,
          },
          recommendations: [
            ...(failedEvents > 0 ? ['Check failed webhook events'] : []),
            ...(unprocessedEvents > 10 ? ['High number of unprocessed events'] : []),
            ...(activeWallets === 0 ? ['No active wallets in last 24 hours'] : []),
          ],
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Admin payment health error:', error);
      res.status(500).json({ error: 'Failed to retrieve payment system health' });
    }
  });

  // Get conversion statistics
  app.get('/api/admin/payments/conversions', requireSuperAdmin, async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const startDate = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);
      
      // Get conversion events
      const conversionEvents = await storage.getWebhookEvents('strike', undefined);
      const recentConversions = conversionEvents.filter(event => 
        event.eventType.includes('quote') && new Date(event.createdAt) > startDate
      );

      const completedConversions = recentConversions.filter(event => 
        event.eventType === 'quote.completed'
      );

      const failedConversions = recentConversions.filter(event => 
        event.eventType === 'quote.failed'
      );

      // Calculate totals
      let totalUsd = 0;
      let totalBtc = 0;
      
      for (const event of completedConversions) {
        const payload = JSON.parse(event.payload);
        totalUsd += payload.amountUsd || 0;
        totalBtc += payload.amountBtc || 0;
      }

      res.json({
        period: {
          days: parseInt(days as string),
          startDate,
          endDate: new Date(),
        },
        conversions: {
          total: recentConversions.length,
          completed: completedConversions.length,
          failed: failedConversions.length,
          successRate: recentConversions.length > 0 ? 
            (completedConversions.length / recentConversions.length) * 100 : 0,
        },
        amounts: {
          totalUsd: Math.round(totalUsd * 100) / 100,
          totalBtc: Math.round(totalBtc * 100000000) / 100000000,
          averageUsd: completedConversions.length > 0 ? 
            Math.round((totalUsd / completedConversions.length) * 100) / 100 : 0,
        },
      });
    } catch (error) {
      console.error('Admin conversion stats error:', error);
      res.status(500).json({ error: 'Failed to retrieve conversion statistics' });
    }
  });

  // Get payment metrics
  app.get('/api/admin/payments/metrics', requireSuperAdmin, async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const metrics = await paymentMonitor.getPaymentMetrics(parseInt(days as string));
      
      res.json(metrics);
    } catch (error) {
      console.error('Admin payment metrics error:', error);
      res.status(500).json({ error: 'Failed to retrieve payment metrics' });
    }
  });

  // Get system health
  app.get('/api/admin/payments/health', requireSuperAdmin, async (req, res) => {
    try {
      const health = await paymentMonitor.getSystemHealth();
      
      res.json(health);
    } catch (error) {
      console.error('Admin system health error:', error);
      res.status(500).json({ error: 'Failed to retrieve system health' });
    }
  });

  // Get alerts
  app.get('/api/admin/payments/alerts', requireSuperAdmin, async (req, res) => {
    try {
      const alerts = await paymentMonitor.getAlerts();
      
      res.json({ alerts });
    } catch (error) {
      console.error('Admin alerts error:', error);
      res.status(500).json({ error: 'Failed to retrieve alerts' });
    }
  });

  // Get performance metrics
  app.get('/api/admin/payments/performance', requireSuperAdmin, async (req, res) => {
    try {
      const performance = await paymentMonitor.getPerformanceMetrics();
      
      res.json(performance);
    } catch (error) {
      console.error('Admin performance metrics error:', error);
      res.status(500).json({ error: 'Failed to retrieve performance metrics' });
    }
  });

  // Test service connections
  app.get('/api/admin/payments/test-connections', requireSuperAdmin, async (req, res) => {
    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      services: {},
    };

    // Test Stripe connection
    try {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey || stripeKey === 'sk_test_your-stripe-secret-key') {
        results.services.stripe = {
          status: 'not_configured',
          configured: false,
          message: 'Stripe API key not configured',
          action: 'Add STRIPE_SECRET_KEY to .env file',
        };
      } else {
        // Test Stripe connection by retrieving account balance
        const testResult = await stripeService.testConnection();
        if (testResult.success) {
          results.services.stripe = {
            status: 'connected',
            configured: true,
            message: 'Stripe connection successful',
            details: {
              mode: testResult.mode,
              accountType: 'standard',
            },
          };
        } else {
          results.services.stripe = {
            status: 'error',
            configured: true,
            message: `Stripe connection failed: ${testResult.error}`,
            error: testResult.error,
          };
        }
      }
    } catch (error: any) {
      results.services.stripe = {
        status: 'error',
        configured: true,
        message: `Stripe connection failed: ${error.message || 'Unknown error'}`,
        error: error.message,
      };
    }

    // Test Strike API connection
    try {
      const strikeKey = process.env.STRIKE_API_KEY;
      if (!strikeKey || strikeKey === 'your-strike-api-key') {
        results.services.strike = {
          status: 'not_configured',
          configured: false,
          message: 'Strike API key not configured',
          action: 'Add STRIKE_API_KEY to .env file',
          info: 'Get your API key from https://strike.me/developers',
        };
      } else {
        // Test Strike connection with a simple API call
        const response = await fetch(`${process.env.STRIKE_BASE_URL || 'https://api.strike.me'}/v1/profiles/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${strikeKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          results.services.strike = {
            status: 'connected',
            configured: true,
            message: 'Strike API connection successful',
            details: {
              handle: data.handle || 'unknown',
            },
          };
        } else {
          results.services.strike = {
            status: 'error',
            configured: true,
            message: `Strike API connection failed: ${response.statusText}`,
            error: `HTTP ${response.status}`,
          };
        }
      }
    } catch (error: any) {
      const strikeKey = process.env.STRIKE_API_KEY;
      if (!strikeKey || strikeKey === 'your-strike-api-key') {
        results.services.strike = {
          status: 'not_configured',
          configured: false,
          message: 'Strike API key not configured',
          action: 'Add STRIKE_API_KEY to .env file',
        };
      } else {
        results.services.strike = {
          status: 'error',
          configured: true,
          message: `Strike API connection failed: ${error.message || 'Unknown error'}`,
          error: error.message,
        };
      }
    }

    // Test Breez SDK connection
    try {
      const breezKey = process.env.BREEZ_API_KEY;
      if (!breezKey || breezKey === 'your-breez-api-key') {
        results.services.breez = {
          status: 'not_configured',
          configured: false,
          message: 'Breez API key not configured',
          action: 'Add BREEZ_API_KEY to .env file',
          info: 'Get your API key from https://breez.technology/',
        };
      } else {
        // Test Breez connection with a simple API call
        const baseUrl = process.env.BREEZ_BASE_URL || 'https://api.breez.technology';
        const response = await fetch(`${baseUrl}/v1/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${breezKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          results.services.breez = {
            status: 'connected',
            configured: true,
            message: 'Breez SDK connection successful',
            details: {
              network: process.env.BREEZ_NETWORK || 'testnet',
            },
          };
        } else {
          results.services.breez = {
            status: 'error',
            configured: true,
            message: `Breez SDK connection failed: ${response.statusText}`,
            error: `HTTP ${response.status}`,
          };
        }
      }
    } catch (error: any) {
      const breezKey = process.env.BREEZ_API_KEY;
      if (!breezKey || breezKey === 'your-breez-api-key') {
        results.services.breez = {
          status: 'not_configured',
          configured: false,
          message: 'Breez API key not configured',
          action: 'Add BREEZ_API_KEY to .env file',
        };
      } else {
        results.services.breez = {
          status: 'error',
          configured: true,
          message: `Breez SDK connection failed: ${error.message || 'Unknown error'}`,
          error: error.message,
        };
      }
    }

    // Test Plaid connection
    try {
      const plaidClientId = process.env.PLAID_CLIENT_ID;
      const plaidSecret = process.env.PLAID_SECRET;
      
      if (!plaidClientId || !plaidSecret || 
          plaidClientId === 'your-plaid-client-id' || 
          plaidSecret === 'your-plaid-secret') {
        results.services.plaid = {
          status: 'not_configured',
          configured: false,
          message: 'Plaid credentials not configured',
          action: 'Add PLAID_CLIENT_ID and PLAID_SECRET to .env file',
          info: 'Get your credentials from https://dashboard.plaid.com/',
        };
      } else {
        // Plaid service test would require initialization - mark as configured
        results.services.plaid = {
          status: 'configured',
          configured: true,
          message: 'Plaid credentials configured (requires bank account linking to test)',
          details: {
            environment: process.env.PLAID_ENV || 'sandbox',
          },
        };
      }
    } catch (error: any) {
      results.services.plaid = {
        status: 'error',
        configured: true,
        message: `Plaid configuration error: ${error.message || 'Unknown error'}`,
        error: error.message,
      };
    }

    // Test Redis connection
    try {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl || redisUrl === 'redis://localhost:6379' || redisUrl.includes('localhost')) {
        results.services.redis = {
          status: 'not_configured',
          configured: false,
          message: 'Redis not configured (using localhost default)',
          action: 'Add REDIS_URL to .env file',
          info: 'For production, use Upstash Redis or similar service',
        };
      } else {
        const connection = getConnection();
        if (!connection) {
          results.services.redis = {
            status: 'error',
            configured: true,
            message: 'Redis connection not available',
            error: 'Connection initialization failed',
          };
        } else {
          // Test Redis connection with PING command
          try {
            await connection.ping();
            results.services.redis = {
              status: 'connected',
              configured: true,
              message: 'Redis connection successful',
              details: {
                url: redisUrl.replace(/:[^:@]+@/, ':****@'), // Mask password in URL
                provider: redisUrl.includes('upstash.io') ? 'Upstash' : 'Other',
              },
            };
          } catch (pingError: any) {
            results.services.redis = {
              status: 'error',
              configured: true,
              message: `Redis ping failed: ${pingError.message || 'Unknown error'}`,
              error: pingError.message,
            };
          }
        }
      }
    } catch (error: any) {
      results.services.redis = {
        status: 'error',
        configured: !!process.env.REDIS_URL,
        message: `Redis connection error: ${error.message || 'Unknown error'}`,
        error: error.message,
      };
    }

    // Calculate overall status
    const serviceStatuses = Object.values(results.services).map((s: any) => s.status);
    const allConnected = serviceStatuses.every((s: string) => s === 'connected');
    const anyConfigured = serviceStatuses.some((s: string) => s !== 'not_configured');
    
    results.summary = {
      overall: allConnected ? 'all_connected' : anyConfigured ? 'partial' : 'not_configured',
      connected: serviceStatuses.filter((s: string) => s === 'connected').length,
      configured: serviceStatuses.filter((s: string) => s !== 'not_configured').length,
      total: serviceStatuses.length,
    };

    res.json(results);
  });
}
