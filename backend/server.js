require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/init');
const { addClient } = require('./services/eventService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Initialize database and seed demo data if needed
initDb();

// SSE Real-time events stream (Disabled for Vercel Serverless)
app.get('/api/events', (req, res) => {
  res.json({ message: 'SSE disabled in serverless environment. Polling active.' });
});

// Routes
app.use('/api/data', require('./routes/data'));
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/forecast', require('./routes/forecast'));
app.use('/api/risk', require('./routes/risk'));
app.use('/api/copilot', require('./routes/copilot'));
app.use('/api/simulator', require('./routes/simulator'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/razorpay', require('./routes/razorpay'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CreditPulse API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mode: process.env.DEMO_MODE === 'true' ? 'demo' : 'live',
    database: 'connected'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║       CreditPulse API Server          ║
║  Running on http://localhost:${PORT}      ║
║  Mode: ${process.env.DEMO_MODE === 'true' ? 'DEMO         ' : 'LIVE         '}              ║
╚═══════════════════════════════════════╝
    `);
  });
}

module.exports = app;
