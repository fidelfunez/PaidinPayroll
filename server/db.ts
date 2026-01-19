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
    fs.mkdirSync(dbDir, { recursive: true });
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Created database directory: ${dbDir}`);
    }
  }
} catch (error: any) {
  console.error('Failed to create database directory:', error);
  throw error;
}

let sqlite: Database;
try {
  sqlite = new Database(dbPath);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Database initialized successfully at: ${dbPath}`);
  }
} catch (error: any) {
  console.error('Failed to initialize database:', error);
  console.error('Database path:', dbPath);
  console.error('Database directory exists:', fs.existsSync(dbDir));
  console.error('Database directory writable:', fs.accessSync ? (() => { try { fs.accessSync(dbDir, fs.constants.W_OK); return true; } catch { return false; } })() : 'unknown');
  throw error; // Re-throw - database is critical, server can't run without it
}

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Export the raw database for session storage
export { sqlite };