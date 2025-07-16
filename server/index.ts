import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';
import { setupAuth } from './auth.js';
import { registerRoutes } from './routes.js';
import { getDatabasePath } from './db-path.js';
import { db } from './db.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Run database migrations on startup with absolute path
try {
  const migrationsPath = path.join(__dirname, 'migrations');
  console.log('Running database migrations from:', migrationsPath);
  migrate(db, { migrationsFolder: migrationsPath });
  console.log('Database migrations completed successfully');
} catch (error) {
  console.error('Migration error:', error);
  // Continue anyway - migrations might already be applied
}

// CORS configuration
app.use(cors({
  origin: [
    'https://paidin-app.netlify.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist/public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Setup authentication
setupAuth(app);

// Register API routes
registerRoutes(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static file handler - ONLY for non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Serve index.html for all other routes (SPA fallback)
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database path: ${getDatabasePath()}`);
});
