import type { Express } from "express";
import { setupAuth } from "../../auth";

export default function authRoutes(app: Express) {
  // Setup authentication routes
  setupAuth(app);
} 