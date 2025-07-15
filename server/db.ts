import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import { getDatabasePath } from './db-path';

// Use the shared utility for the database path
const dbPath = getDatabasePath();

const sqlite = new Database(dbPath);
console.log(`Database initialized successfully at: ${dbPath}`);

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Export the raw database for session storage
export { sqlite };