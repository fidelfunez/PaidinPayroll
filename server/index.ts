import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all API routes FIRST
registerRoutes(app);

// Static files SECOND
const distPath = path.resolve(__dirname, "..", "dist", "public");
app.use(express.static(distPath));

// Catch-all for React app (but NOT for /api/*)
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});

const port = process.env.PORT || 3000;
const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";
app.listen(port, () => {
  console.log(`[express] serving on port ${port}`);
});
