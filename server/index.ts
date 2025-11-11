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
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { storage } from './storage.js';
import { paymentPolling } from './payment-polling';
import { ensureFidelUser } from './ensure-fidel-user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 8080;

// Run database migrations on startup
try {
  // In production (dist folder), migrations are at dist/migrations (copied during build)
  // In development, they're at ./migrations from project root
  let migrationsPath: string;
  if (process.env.NODE_ENV === 'production') {
    // In production: __dirname is /app/dist, migrations are at /app/dist/migrations
    migrationsPath = path.join(__dirname, 'migrations');
  } else {
    // In development: migrations are at project root
    migrationsPath = path.join(process.cwd(), 'migrations');
  }
  console.log('Running database migrations from:', migrationsPath);
  console.log('__dirname:', __dirname);
  console.log('process.cwd():', process.cwd());
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  migrate(db, { migrationsFolder: migrationsPath });
  console.log('✅ Database migrations completed successfully');
} catch (error: any) {
  console.error('❌ Migration error:', error);
  console.error('Error message:', error?.message);
  console.error('Error stack:', error?.stack);
  // In production, we should fail if migrations don't work
  // But log the error first to help debug
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: Database migrations failed in production');
  }
  // Continue anyway - migrations might already be applied
  // This is expected if tables already exist
}

// CORS configuration
const allowedOrigins = [
    'https://app.paidin.io',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://localhost:8080'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
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
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database path: ${getDatabasePath()}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
  
  // Ensure fidel user exists (runs on every server start)
  await ensureFidelUser();
  
  // Start payment polling (gracefully handle errors)
  try {
    paymentPolling.startPolling();
    console.log('Payment polling service started');
  } catch (error) {
    console.error('Warning: Failed to start payment polling service:', error);
    console.log('Server will continue without payment polling');
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
