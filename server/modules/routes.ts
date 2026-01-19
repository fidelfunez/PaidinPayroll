// Centralized server routing configuration
import type { Express } from "express";
import { createServer, type Server } from "http";

// Import active module routes
import authRoutes from "./auth/routes";
import accountingRoutes from "./accounting/routes";
import adminRoutes from "./admin/routes";

// Register all module routes
export function registerAllRoutes(app: Express): Server {
  // Register auth routes (it's a function that sets up auth)
  authRoutes(app);
  
  // Register accounting routes
  app.use("/api/accounting", accountingRoutes);
  console.log('✅ Accounting routes registered at /api/accounting');
  console.log('   Available routes include: POST /api/accounting/wallets/:id/fetch-transactions');

  // Register admin routes
  app.use("/api/admin", adminRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Return the HTTP server
  return createServer(app);
} 