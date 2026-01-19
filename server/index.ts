import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';
import session from 'express-session';
import { registerAllRoutes } from './modules/routes';
import { getDatabasePath } from './db-path.js';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 8080;

// Note: Migrations disabled for MVP - use `npm run db:push` to apply schema
// The database schema is defined in shared/schema.ts and applied via drizzle-kit push
console.log('⚠️  Migrations skipped - using schema-first approach');
console.log('💡 Run `npm run db:push` to apply schema changes');

// CORS configuration
const allowedOrigins = [
    'https://app.paidin.io',
    process.env.FRONTEND_URL || 'http://localhost:3000', // Production frontend URL
    process.env.NETLIFY_URL, // Netlify frontend URL (if set)
    // Allow all Netlify preview deployments (for development/testing)
    ...(process.env.NODE_ENV !== 'production' ? [] : [
      /^https:\/\/.*\.netlify\.app$/, // All Netlify preview deployments
      /^https:\/\/.*\.netlify\.com$/  // Netlify subdomains
    ]),
    // Development origins
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://localhost:8080'
].filter(Boolean); // Remove undefined values

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

// Register all module routes
registerAllRoutes(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static file handler - ONLY for non-API routes
app.get('*', (req, res) => {
  // Skip API routes
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
  console.log(`✅ PaidIn Accounting Server running on port ${PORT}`);
  console.log(`📁 Database path: ${getDatabasePath()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 CORS allowed origins: ${allowedOrigins.join(', ')}`);
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
