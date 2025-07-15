import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';

// Create SQLite database
const dbPath = process.env.NODE_ENV === 'production' ? './paidin.db' : 'paidin.db';

// Ensure directory exists in production
if (process.env.NODE_ENV === 'production') {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

const sqlite = new Database(dbPath);

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Export the raw database for session storage
export { sqlite };