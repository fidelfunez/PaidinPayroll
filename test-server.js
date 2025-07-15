import express from 'express';

const app = express();
app.use(express.json());

// Test API route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(3001, () => {
  console.log('Test server running on port 3001');
}); 