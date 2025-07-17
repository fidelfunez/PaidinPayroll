import type { Express } from "express";
import { requireAuth } from "../../auth";
import { storage } from "../../storage";
import { z } from "zod";

// Integration schema
const createIntegrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(['slack', 'quickbooks', 'zapier', 'btcpay', 'lnbits']),
  config: z.record(z.any()),
});

export default function integrationRoutes(app: Express) {
  // Get all integrations
  app.get('/api/integrations', requireAuth, async (req, res) => {
    try {
      const integrations = await storage.getIntegrations();
      res.json(integrations);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
      res.status(500).json({ message: 'Failed to fetch integrations' });
    }
  });

  // Get single integration
  app.get('/api/integrations/:id', requireAuth, async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const integration = await storage.getIntegration(integrationId);
      
      if (!integration) {
        return res.status(404).json({ message: 'Integration not found' });
      }
      
      res.json(integration);
    } catch (error) {
      console.error('Failed to fetch integration:', error);
      res.status(500).json({ message: 'Failed to fetch integration' });
    }
  });

  // Create new integration
  app.post('/api/integrations', requireAuth, async (req, res) => {
    try {
      const validation = createIntegrationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid integration data', errors: validation.error.errors });
      }

      const integration = await storage.createIntegration({
        ...validation.data,
        config: JSON.stringify(validation.data.config),
        createdBy: req.user!.id,
        isActive: true,
      });

      res.status(201).json(integration);
    } catch (error) {
      console.error('Failed to create integration:', error);
      res.status(500).json({ message: 'Failed to create integration' });
    }
  });

  // Update integration
  app.put('/api/integrations/:id', requireAuth, async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const updates = req.body;
      
      // Convert config to JSON string if provided
      if (updates.config && typeof updates.config === 'object') {
        updates.config = JSON.stringify(updates.config);
      }

      const integration = await storage.updateIntegration(integrationId, updates);
      if (!integration) {
        return res.status(404).json({ message: 'Integration not found' });
      }

      res.json(integration);
    } catch (error) {
      console.error('Failed to update integration:', error);
      res.status(500).json({ message: 'Failed to update integration' });
    }
  });

  // Test integration
  app.post('/api/integrations/:id/test', requireAuth, async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const result = await storage.testIntegration(integrationId);
      res.json(result);
    } catch (error) {
      console.error('Failed to test integration:', error);
      res.status(500).json({ message: 'Failed to test integration' });
    }
  });

  // Toggle integration
  app.patch('/api/integrations/:id/toggle', requireAuth, async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const { isActive } = req.body;

      const integration = await storage.toggleIntegration(integrationId, isActive);
      if (!integration) {
        return res.status(404).json({ message: 'Integration not found' });
      }

      res.json(integration);
    } catch (error) {
      console.error('Failed to toggle integration:', error);
      res.status(500).json({ message: 'Failed to toggle integration' });
    }
  });

  // Delete integration
  app.delete('/api/integrations/:id', requireAuth, async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      await storage.deleteIntegration(integrationId);
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete integration:', error);
      res.status(500).json({ message: 'Failed to delete integration' });
    }
  });
} 