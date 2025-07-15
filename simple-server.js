import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API routes FIRST
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/user', (req, res) => {
  res.json({ message: 'Not authenticated' });
});

// Static files SECOND
const distPath = path.resolve(__dirname, 'dist', 'public');
app.use(express.static(distPath));

// Catch-all for React app (but NOT for /api/*)
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

const port = 3000;
app.listen(port, () => {
  console.log(`Simple server running on port ${port}`);
  console.log(`Static files from: ${distPath}`);
}); 