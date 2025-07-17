// Centralized server routing configuration
import type { Express } from "express";
import { createServer, type Server } from "http";

// Import all module routes
import { authRoutes } from "./auth";
import dashboardRoutes from "./dashboard";
import payrollRoutes from "./payroll";
import employeesRoutes from "./employees";
import reimbursementsRoutes from "./reimbursements";
import timeTrackingRoutes from "./time-tracking";
import timeOffRoutes from "./time-off";
import reportsRoutes from "./reports";
import withdrawalMethodsRoutes from "./withdrawal-methods";
import settingsRoutes from "./settings";
import messagingRoutes from "./messaging";
import adminRoutes from "./admin";
import invoicingRoutes from "./invoicing";
import integrationsRoutes from "./integrations";
import onboardingRoutes from "./onboarding";
import { btcRoutes } from "./btc";
import staticRoutes from "./static";

// Register all module routes
export function registerAllRoutes(app: Express): Server {
  // Register each module's routes
  authRoutes(app);
  dashboardRoutes(app);
  payrollRoutes(app);
  employeesRoutes(app);
  reimbursementsRoutes(app);
  timeTrackingRoutes(app);
  timeOffRoutes(app);
  reportsRoutes(app);
  withdrawalMethodsRoutes(app);
  settingsRoutes(app);
  messagingRoutes(app);
  adminRoutes(app);
  invoicingRoutes(app);
  integrationsRoutes(app);
  onboardingRoutes(app);
  btcRoutes(app);
  staticRoutes(app);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Return the HTTP server
  return createServer(app);
} 