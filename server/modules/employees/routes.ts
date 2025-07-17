import type { Express } from "express";
import { requireAdmin } from "../../auth";
import { storage } from "../../storage";

export default function employeeRoutes(app: Express) {
  // Employee endpoints
  app.get('/api/employees', requireAdmin, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch employees' });
    }
  });

  // Get employees with withdrawal methods for pay 