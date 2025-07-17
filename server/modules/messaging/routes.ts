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
