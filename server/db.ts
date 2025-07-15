import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";

// Create SQLite database
const dbPath = process.env.NODE_ENV === 'production' ? '/app/data/paidin.db' : 'paidin.db';
const sqlite = new Database(dbPath);

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Export the raw database for session storage
export { sqlite };