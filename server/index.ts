import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';
import session from 'express-session';
import { registerAllRoutes } from './modules/routes';
import { getDatabasePath } from './db-path.js';
import { db, sqlite } from './db.js';
import { sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 8080;

// Schema sync: Ensure required columns exist
function syncSchema() {
  try {
    // Check if email_verified column exists in users table
    const tableInfo = sqlite.prepare("PRAGMA table_info(users)").all() as Array<{ name: string; type: string }>;
    const columnNames = tableInfo.map(col => col.name);
    
    // Check and add email_verified column
    if (!columnNames.includes('email_verified')) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('📊 Adding email_verified column to users table...');
      }
      sqlite.exec(`
        ALTER TABLE users 
        ADD COLUMN email_verified INTEGER DEFAULT 0
      `);
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ email_verified column added successfully');
      }
    } else if (process.env.NODE_ENV !== 'production') {
      console.log('✅ email_verified column already exists');
    }
    
    // Check and add email_verification_token column
    if (!columnNames.includes('email_verification_token')) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('📊 Adding email_verification_token column to users table...');
      }
      sqlite.exec(`
        ALTER TABLE users 
        ADD COLUMN email_verification_token TEXT
      `);
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ email_verification_token column added successfully');
      }
    }
    
    // Check and add email_verification_token_expiry column
    if (!columnNames.includes('email_verification_token_expiry')) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('📊 Adding email_verification_token_expiry column to users table...');
      }
      sqlite.exec(`
        ALTER TABLE users 
        ADD COLUMN email_verification_token_expiry INTEGER
      `);
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ email_verification_token_expiry column added successfully');
      }
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Schema sync complete');
    }
  } catch (error: any) {
    // If column already exists, SQLite will throw an error - that's okay
    if (error.message?.includes('duplicate column') || error.message?.includes('already exists')) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Columns already exist (detected via error)');
      }
    } else {
      console.error('⚠️  Schema sync warning:', error.message);
      // Don't throw - allow server to start even if schema sync fails
    }
  }
}

// Run database schema push on startup (creates tables if they don't exist)
async function pushSchema() {
  try {
    // Check if wallets table exists
    const result = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='wallets'").get() as { name: string } | undefined;
    
    if (result) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Database tables already exist');
      }
    } else {
      console.log('📊 Database tables not found. Creating schema...');
      createTables();
      console.log('✅ Database schema created successfully');
    }
  } catch (error: any) {
    console.error('⚠️  Schema push warning:', error.message);
    // Don't throw - allow server to start even if schema push fails
    // The error will be caught when trying to use the database
  }
}

async function createTables() {
  // Create all tables based on schema
  // This is a fallback if drizzle-kit push isn't available
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo TEXT,
      domain TEXT,
      primary_color TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES companies(id),
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      profile_photo TEXT,
      email_verified INTEGER DEFAULT 0,
      email_verification_token TEXT,
      email_verification_token_expiry INTEGER,
      created_at INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      company_id INTEGER NOT NULL REFERENCES companies(id),
      wallet_type TEXT NOT NULL,
      wallet_data TEXT NOT NULL,
      name TEXT NOT NULL,
      network TEXT NOT NULL DEFAULT 'mainnet',
      is_active INTEGER NOT NULL DEFAULT 1,
      deleted_at INTEGER,
      created_at INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id INTEGER NOT NULL REFERENCES wallets(id),
      company_id INTEGER NOT NULL REFERENCES companies(id),
      tx_id TEXT NOT NULL,
      amount_btc REAL NOT NULL,
      usd_value REAL NOT NULL,
      fee_btc REAL DEFAULT 0 NOT NULL,
      fee_usd REAL DEFAULT 0 NOT NULL,
      timestamp INTEGER NOT NULL,
      tx_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      confirmations INTEGER DEFAULT 0,
      category_id INTEGER REFERENCES categories(id),
      counterparty TEXT,
      exchange_rate REAL NOT NULL,
      memo TEXT,
      notes TEXT,
      created_at INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      company_id INTEGER NOT NULL REFERENCES companies(id),
      name TEXT NOT NULL,
      quickbooks_account TEXT,
      category_type TEXT NOT NULL,
      is_default INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      company_id INTEGER NOT NULL REFERENCES companies(id),
      amount_btc REAL NOT NULL,
      usd_price REAL NOT NULL,
      purchase_date INTEGER NOT NULL,
      notes TEXT,
      created_at INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS transaction_lots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL REFERENCES transactions(id),
      purchase_id INTEGER NOT NULL REFERENCES purchases(id),
      btc_amount_used REAL NOT NULL,
      created_at INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL DEFAULT 'coingecko',
      currency TEXT NOT NULL DEFAULT 'USD',
      rate REAL NOT NULL,
      timestamp INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(source, currency, timestamp)
    );
  `);
}

// Fix exchange_rates table if it has wrong column name
function fixExchangeRatesTable() {
  try {
    const tableInfo = sqlite.prepare("PRAGMA table_info(exchange_rates)").all() as Array<{ name: string; type: string }>;
    const columnNames = tableInfo.map(col => col.name);
    
    // Check if table has 'date' column instead of 'timestamp'
    if (columnNames.includes('date') && !columnNames.includes('timestamp')) {
      console.log('📊 Fixing exchange_rates table: renaming date column to timestamp...');
      sqlite.exec(`
        ALTER TABLE exchange_rates RENAME COLUMN date TO timestamp;
      `);
      console.log('✅ Fixed exchange_rates table');
    }
  } catch (error: any) {
    // Table might not exist yet, that's okay
    if (!error.message?.includes('no such table')) {
      console.error('⚠️  Error fixing exchange_rates table:', error.message);
    }
  }
}

// Run schema push on startup (wrapped to handle async)
(async () => {
  await pushSchema();
  // Fix exchange_rates table if needed
  fixExchangeRatesTable();
  // Run schema sync on startup (for column additions)
  syncSchema();
})().catch((error) => {
  console.error('Failed to initialize database schema:', error);
  // Continue anyway - server will start but database operations may fail
});

// CORS configuration
const allowedOrigins: (string | RegExp)[] = [
    // Production origins from environment variables
    process.env.APP_URL,
    process.env.FRONTEND_URL,
    process.env.NETLIFY_URL,
    // Allow all Netlify preview deployments (for development/testing)
    ...(process.env.NODE_ENV === 'production' ? [
      /^https:\/\/.*\.netlify\.app$/, // All Netlify preview deployments
      /^https:\/\/.*\.netlify\.com$/  // Netlify subdomains
    ] : []),
    // Development origins (only in development)
    ...(process.env.NODE_ENV !== 'production' ? [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173',
      'http://localhost:8080'
    ] : [])
].filter(Boolean) as (string | RegExp)[]; // Remove undefined values

// CORS with origin validation
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check against allowed origins
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Session middleware
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET;
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET or JWT_SECRET environment variable is required');
}

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Required for cross-origin in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.static(path.join(__dirname, '../dist/public')));

// Register all module routes (must be before catch-all route)
registerAllRoutes(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static file handler - ONLY for non-API routes
// This catch-all must come AFTER all API routes are registered
app.get('*', (req, res) => {
  // Skip API routes - these should have been handled by registerAllRoutes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // Skip static assets (let express.static handle them)
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.webmanifest'];
  const hasStaticExtension = staticExtensions.some(ext => req.path.endsWith(ext));
  
  if (hasStaticExtension) {
    return res.status(404).json({ error: 'Static file not found' });
  }

  // Serve index.html for all other routes (SPA fallback)
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

// Start server with error handling
app.listen(PORT, '0.0.0.0', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`✅ PaidIn Accounting Server running on port ${PORT}`);
    console.log(`📁 Database path: ${getDatabasePath()}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔐 CORS allowed origins: ${allowedOrigins.filter(o => typeof o === 'string').join(', ')}`);
    console.log('');
    console.log('📊 Accounting API endpoints:');
    console.log('  - GET  /api/accounting/wallets');
    console.log('  - POST /api/accounting/wallets');
    console.log('  - GET  /api/accounting/transactions');
    console.log('  - POST /api/accounting/transactions/import');
    console.log('  - GET  /api/accounting/categories');
    console.log('  - POST /api/accounting/categories');
    console.log('  - GET  /api/accounting/export/quickbooks');
    console.log('  - GET  /api/accounting/rates/current');
    console.log('');
    console.log('🚀 Ready to accept connections!');
  }
});

// Handle uncaught errors to prevent server crashes
// In production, we want to log but allow the server to recover from non-critical errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Only exit on critical errors that would cause the server to be in an invalid state
  // For now, log and continue to prevent restart loops
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Log but don't exit - these are typically async operation failures
});
