import type { Express } from "express";
import { stripeService } from '../../services/stripe-service';
import { strikeService } from '../../services/strike-service';
import { breezService } from '../../services/breez-service';
import { paymentOrchestrator } from '../../orchestrators/payment-orchestrator';
import { storage } from '../../storage';

export function registerWebhookRoutes(app: Express): void {
  // Stripe webhook endpoint
  app.post('/api/webhooks/stripe', async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const payload = JSON.stringify(req.body);

      if (!signature) {
        return res.status(400).json({ error: 'Missing Stripe signature' });
      }

      // Verify webhook signature
      const event = stripeService.verifyWebhookSignature(payload, signature);
      
      // Handle webhook event
      await paymentOrchestrator.handleWebhook('stripe', event.type, event.id, event);
      
      res.json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  });

  // Strike webhook endpoint
  app.post('/api/webhooks/strike', async (req, res) => {
    try {
      const signature = req.headers['strike-signature'] as string;
      const payload = JSON.stringify(req.body);
      const eventType = req.body.type;
      const eventId = req.body.id;

      if (!signature) {
        return res.status(400).json({ error: 'Missing Strike signature' });
      }

      // Verify webhook signature
      const isValid = strikeService.verifyWebhookSignature(payload, signature);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid Strike signature' });
      }

      // Handle webhook event
      await paymentOrchestrator.handleWebhook('strike', eventType, eventId, req.body);
      
      res.json({ received: true });
    } catch (error) {
      console.error('Strike webhook error:', error);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  });

  // Breez webhook endpoint
  app.post('/api/webhooks/breez', async (req, res) => {
    try {
      const signature = req.headers['breez-signature'] as string;
      const payload = JSON.stringify(req.body);
      const eventType = req.body.type;
      const eventId = req.body.id;

      if (!signature) {
        return res.status(400).json({ error: 'Missing Breez signature' });
      }

      // Verify webhook signature
      const isValid = breezService.verifyWebhookSignature(payload, signature);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid Breez signature' });
      }

      // Handle webhook event
      await paymentOrchestrator.handleWebhook('breez', eventType, eventId, req.body);
      
      res.json({ received: true });
    } catch (error) {
      console.error('Breez webhook error:', error);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  });

  // Generic webhook endpoint for testing
  app.post('/api/webhooks/test', async (req, res) => {
    try {
      console.log('Test webhook received:', req.body);
      res.json({ received: true, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Test webhook error:', error);
      res.status(400).json({ error: 'Test webhook processing failed' });
    }
  });

  // Webhook event logs endpoint (admin only)
  app.get('/api/webhooks/events', async (req, res) => {
    try {
      const { provider, processed, limit = 50 } = req.query;
      
      const events = await storage.getWebhookEvents(
        provider as string,
        processed ? processed === 'true' : undefined
      );

      res.json({
        events: events.slice(0, parseInt(limit as string)),
        total: events.length,
      });
    } catch (error) {
      console.error('Webhook events retrieval error:', error);
      res.status(500).json({ error: 'Failed to retrieve webhook events' });
    }
  });

  // Replay webhook event (admin only)
  app.post('/api/webhooks/events/:id/replay', async (req, res) => {
    try {
      const { id } = req.params;
      const eventId = parseInt(id);

      const event = await storage.getWebhookEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Webhook event not found' });
      }

      // Replay the webhook event
      await paymentOrchestrator.handleWebhook(
        event.provider as 'stripe' | 'strike' | 'breez',
        event.eventType,
        event.eventId,
        JSON.parse(event.payload)
      );

      res.json({ message: 'Webhook event replayed successfully' });
    } catch (error) {
      console.error('Webhook replay error:', error);
      res.status(500).json({ error: 'Failed to replay webhook event' });
    }
  });
}
