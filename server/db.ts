import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';

// Create SQLite database
let dbPath = process.env.NODE_ENV === 'production' ? '/app/data/paidin.db' : 'paidin.db';

// Ensure directory exists in production
if (process.env.NODE_ENV === 'production') {
  const dbDir = path.dirname(dbPath);
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  } catch (error) {
    console.error(`Failed to create directory ${dbDir}:`, error);
    // Fallback to current directory if /app/data doesn't exist
    dbPath = './paidin.db';
    console.log(`Falling back to: ${dbPath}`);
  }
}

const sqlite = new Database(dbPath);
console.log(`Database initialized successfully at: ${dbPath}`);

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Export the raw database for session storage
export { sqlite };