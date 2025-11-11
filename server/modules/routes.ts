// Centralized server routing configuration
import type { Express } from "express";
import { createServer, type Server } from "http";

// Import all module routes
import authRoutes from "./auth/routes";
import dashboardRoutes from "./dashboard/routes";
import payrollRoutes from "./payroll/routes";
import employeeRoutes from "./employees/routes";
import reimbursementRoutes from "./reimbursements/routes";
import btcRoutes from "./btc/routes";
import messagingRoutes from "./messaging/routes";
import integrationRoutes from "./integrations/routes";
import adminRoutes from "./admin/routes";
import onboardingRoutes from "./onboarding/routes";
import platformRoutes from "./platform/routes";

// Module route configurations
export const moduleRoutes = {
  auth: authRoutes,
  dashboard: dashboardRoutes,
  payroll: payrollRoutes,
  employees: employeeRoutes,
  reimbursements: reimbursementRoutes,
  btc: btcRoutes,
  messaging: messagingRoutes,
  integrations: integrationRoutes,
  admin: adminRoutes,
  onboarding: onboardingRoutes,
  platform: platformRoutes,
};

// Register all module routes
export function registerAllRoutes(app: Express): Server {
  // Register each module's routes
  Object.values(moduleRoutes).forEach(registerRoutes => {
    registerRoutes(app);
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Return the HTTP server
  return createServer(app);
}

// Helper function to get routes by module
export const getRoutesByModule = (moduleName: keyof typeof moduleRoutes) => {
  return moduleRoutes[moduleName];
}; 