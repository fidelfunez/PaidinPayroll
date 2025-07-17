import type { Express } from "express";
import { requireAuth } from "../../auth";
import { storage } from "../../storage";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";

export default function messagingRoutes(app: Express) {
  // Conversation and Message endpoints
  app.get('/api/conversations', requireAuth, async (req, res) => {
    try {
      const conversations = await storage.getUserConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  app.post('/api/conversations', requireAuth, async (req, res) => {
    try {
      const validation = insertConversationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid conversation data', errors: validation.error.errors });
      }
      const conversation = await storage.createConversation(validation.data);
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Conversation creation error:', error);
      res.status(500).json({ message: 'Failed to create conversation' });
    }
  });

  app.get('/api/conversations/:id', requireAuth, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch conversation' });
    }
  });

  app.post('/api/conversations/:id/messages', requireAuth, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const validation = insertMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid message data', errors: validation.error.errors });
      }
      const message = await storage.createMessage({ ...validation.data, conversationId });
      res.status(201).json(message);
    } catch (error) {
      console.error('Message creation error:', error);
      res.status(500).json({ message: 'Failed to create message' });
    }
  });

  app.get('/api/conversations/:id/messages', requireAuth, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getConversationMessages(conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });
}
```

```typescript:server/modules/integrations/routes.ts
import type { Express } from "express";
import { requireAuth } from "../../auth";
import { btcpayService } from "../../btcpay";

export default function integrationRoutes(app: Express) {
  // BtcpayInvoice endpoints
  app.get('/api/btcpay/invoices', requireAuth, async (req, res) => {
    try {
      const invoices = await btcpayService.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch BTCPay invoices' });
    }
  });

  app.post('/api/btcpay/invoices', requireAuth, async (req, res) => {
    try {
      const { amount, currency, description, orderId, customerEmail, customerName, redirectUrl, webhookUrl } = req.body;
      const invoice = await btcpayService.createInvoice({
        amount: parseFloat(amount),
        currency: currency || 'USD',
        description,
        orderId,
        customerEmail,
        customerName,
        redirectUrl,
        webhookUrl
      });
      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create BTCPay invoice' });
    }
  });

  app.get('/api/btcpay/invoices/:id', requireAuth, async (req, res) => {
    try {
      const invoiceId = req.params.id.toString();
      const invoice = await btcpayService.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch BTCPay invoice' });
    }
  });

  app.patch('/api/btcpay/invoices/:id', requireAuth, async (req, res) => {
    try {
      const invoiceId = req.params.id.toString();
      res.status(501).json({ message: 'Not implemented' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update BTCPay invoice' });
    }
  });

  app.delete('/api/btcpay/invoices/:id', requireAuth, async 