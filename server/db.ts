import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import { getDatabasePath } from './db-path';
import fs from 'fs';
import path from 'path';

// Use the shared utility for the database path
const dbPath = getDatabasePath();

// Ensure the directory exists before trying to open the database
const dbDir = path.dirname(dbPath);
try {
  if (!fs.existsSync(dbDir)) {
    console.log(`Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`✅ Database directory created: ${dbDir}`);
  }
  
  // Verify directory is writable
  try {
    fs.accessSync(dbDir, fs.constants.W_OK);
    console.log(`✅ Database directory is writable: ${dbDir}`);
  } catch (accessError: any) {
    console.error(`❌ Database directory is NOT writable: ${dbDir}`, accessError);
    throw new Error(`Database directory is not writable: ${dbDir}`);
  }
} catch (error: any) {
  console.error('❌ Failed to create/verify database directory:', error);
  console.error('Database path:', dbPath);
  console.error('Database directory:', dbDir);
  throw error;
}

let sqlite: Database;
try {
  console.log(`📂 Opening database at: ${dbPath}`);
  sqlite = new Database(dbPath);
  console.log(`✅ Database initialized successfully at: ${dbPath}`);
} catch (error: any) {
  console.error('❌ Failed to initialize database:', error);
  console.error('Database path:', dbPath);
  console.error('Database directory exists:', fs.existsSync(dbDir));
  try {
    fs.accessSync(dbDir, fs.constants.W_OK);
    console.error('Database directory is writable: YES');
  } catch (accessError) {
    console.error('Database directory is writable: NO', accessError);
  }
  throw error; // Re-throw - database is critical, server can't run without it
}

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Export the raw database for session storage
export { sqlite };