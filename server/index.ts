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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Run database migrations on startup with absolute path
// try {
//   const migrationsPath = path.join(__dirname, '../migrations');
//   console.log('Running database migrations from:', migrationsPath);
//   migrate(db, { migrationsFolder: migrationsPath });
//   console.log('Database migrations completed successfully');
// } catch (error) {
//   console.error('Migration error:', error);
//   // Continue anyway - migrations might already be applied
//   // This is expected if tables already exist
// }

// CORS configuration
app.use(cors({
  origin: [
    'https://app.paidin.io',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
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

// Start payment polling after server starts
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database path: ${getDatabasePath()}`);
  
  // Start payment polling
  paymentPolling.startPolling();
  console.log('Payment polling service started');
});
