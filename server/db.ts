import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import { getDatabasePath } from './db-path';

// Use the shared utility for the database path
const dbPath = getDatabasePath();

let sqlite: Database;
try {
  sqlite = new Database(dbPath);
  console.log(`Database initialized successfully at: ${dbPath}`);
} catch (error) {
  console.error('Failed to initialize database:', error);
  console.error('Database path:', dbPath);
  throw error; // Re-throw - database is critical, server can't run without it
}

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Export the raw database for session storage
export { sqlite };