import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { registerRoutes } from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy for Railway
app.set('trust proxy', 1);

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all API routes FIRST
registerRoutes(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files
const distPath = path.resolve(__dirname, "..", "dist", "public");
console.log('Static files path:', distPath);

// Check if static files directory exists
if (!fs.existsSync(distPath)) {
  console.error('ERROR: Static files directory does not exist:', distPath);
} else {
  console.log('Static files directory exists');
  const files = fs.readdirSync(distPath);
  console.log('Files in dist/public:', files);
}

app.use(express.static(distPath));

// Catch-all for React app (but NOT for /api/*)
app.get(/^\/(?!api\/).*/, (req, res) => {
  console.log('Serving index.html for path:', req.path);
  const indexPath = path.resolve(distPath, "index.html");
  console.log('Index file path:', indexPath);
  
  // Check if index.html exists
  if (!fs.existsSync(indexPath)) {
    console.error('ERROR: index.html does not exist at:', indexPath);
    return res.status(500).json({ error: 'index.html not found' });
  }
  
  // Set a timeout to prevent hanging
  const timeout = setTimeout(() => {
    console.error('Timeout serving index.html');
    res.status(500).json({ error: 'Timeout serving application' });
  }, 10000); // 10 second timeout
  
  res.sendFile(indexPath, (err) => {
    clearTimeout(timeout);
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).json({ error: 'Failed to serve application', details: err.message });
    } else {
      console.log('Successfully served index.html');
    }
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";

app.listen(port, host, () => {
  console.log(`[express] serving on port ${port} on ${host}`);
  console.log(`[express] static files from: ${distPath}`);
});
