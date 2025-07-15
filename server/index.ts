import express from "express";
import path from "path";
import { fileURLToPath } from "url";
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
app.use(express.static(distPath));

// Catch-all for React app (but NOT for /api/*)
app.get(/^\/(?!api\/).*/, (req, res) => {
  console.log('Serving index.html for path:', req.path);
  const indexPath = path.resolve(distPath, "index.html");
  console.log('Index file path:', indexPath);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).json({ error: 'Failed to serve application' });
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
