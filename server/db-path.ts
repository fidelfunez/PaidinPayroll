// Utility to get the correct SQLite database path for all uses (main DB and session store)
import fs from 'fs';
import path from 'path';

export function getDatabasePath() {
  // Check for Fly.io volume mount first
  if (process.env.NODE_ENV === 'production') {
    // Try Fly.io volume mount path first
    const flyVolumePath = '/app/data/paidin.db';
    const flyVolumeDir = path.dirname(flyVolumePath);
    
    try {
      if (!fs.existsSync(flyVolumeDir)) {
        fs.mkdirSync(flyVolumeDir, { recursive: true });
      }
      // Check if directory is writable
      fs.accessSync(flyVolumeDir, fs.constants.W_OK);
      return flyVolumePath;
    } catch (error) {
      console.warn('Fly.io volume path not available, using local path:', error);
      // Fallback to current directory if volume mount doesn't work
      return './paidin.db';
    }
  }

  // Development: use local path
  return 'paidin.db';
} 