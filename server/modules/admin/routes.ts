import type { Express } from "express";
import { requireAuth } from "../../auth";
import { storage } from "../../storage";

export default function adminRoutes(app: Express) {
  // Profile update endpoint
  app.patch('/api/user/profile', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const updates = req.body;
      const updatedUser = await storage.updateUser(user.id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });
}
