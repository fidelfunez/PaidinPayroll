// Utility to get the correct SQLite database path for all uses (main DB and session store)
import fs from 'fs';
import path from 'path';

export function getDatabasePath() {
  let dbPath = process.env.NODE_ENV === 'production' ? '/app/data/paidin.db' : 'paidin.db';

  if (process.env.NODE_ENV === 'production') {
    const dbDir = path.dirname(dbPath);
    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    } catch (error) {
      // Fallback to local file if /app/data cannot be created (should not happen on Railway)
      dbPath = './paidin.db';
    }
  }

  return dbPath;
} 