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
      const validatedData = createIntegrationSchema.parse(req.body);
      const user = req.user!;
      
      const integration = await storage.createIntegration({
        ...validatedData,
        config: JSON.stringify(validatedData.config),
        createdBy: user.id,
      });
      
      res.status(201).json(integration);
    } catch (error) {
      console.error('Failed to create integration:', error);
      res.status(500).json({ message: 'Failed to create integration' });
    }
  });
} 