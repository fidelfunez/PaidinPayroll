import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { btcpayService } from "./btcpay";

// Import all module routes
import { authRoutes } from "./modules/auth";
import dashboardRoutes from "./modules/dashboard";
import payrollRoutes from "./modules/payroll";
import employeesRoutes from "./modules/employees";
import reimbursementsRoutes from "./modules/reimbursements";
import timeTrackingRoutes from "./modules/time-tracking";
import timeOffRoutes from "./modules/time-off";
import reportsRoutes from "./modules/reports";
import withdrawalMethodsRoutes from "./modules/withdrawal-methods";
import settingsRoutes from "./modules/settings";
import messagingRoutes from "./modules/messaging";
import adminRoutes from "./modules/admin";
import invoicingRoutes from "./modules/invoicing";
import integrationsRoutes from "./modules/integrations";
import onboardingRoutes from "./modules/onboarding";
import { btcRoutes } from "./modules/btc";
import staticRoutes from "./modules/static";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Register all module routes
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

  // Create and return server
  return createServer(app);
}
