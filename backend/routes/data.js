const express = require('express');
const router = express.Router();
const { getDb } = require('../db/init');

// GET /api/data/transactions
router.get('/transactions', (req, res) => {
  try {
    const db = getDb();
    const { limit = 50, offset = 0, status } = req.query;

    let query = 'SELECT * FROM transactions WHERE is_demo = 0';
    const params = [];
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const transactions = db.prepare(query).all(...params);
    const { count } = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE is_demo = 0').get();
    const meta = db.prepare('SELECT last_synced_at, sync_error FROM merchants WHERE id = 1').get();

    res.json({
      transactions,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      source: 'Razorpay Test Mode',
      last_synced_at: meta?.last_synced_at || null,
      sync_error: meta?.sync_error || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/data/settlements
router.get('/settlements', (req, res) => {
  try {
    const db = getDb();
    const settlements = db.prepare(
      'SELECT * FROM settlements WHERE is_demo = 0 ORDER BY settled_at DESC LIMIT 50'
    ).all();
    const meta = db.prepare('SELECT last_synced_at, sync_error FROM merchants WHERE id = 1').get();
    res.json({
      settlements,
      source: 'Razorpay Test Mode',
      last_synced_at: meta?.last_synced_at || null,
      sync_error: meta?.sync_error || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/data/balance
router.get('/balance', (req, res) => {
  try {
    const db = getDb();
    const config = db.prepare('SELECT * FROM merchants WHERE id = 1').get();
    res.json({
      current_balance: config?.current_balance || 0,
      safety_buffer: config?.safety_buffer || 15000,
      merchant_name: config?.merchant_name || 'Connected Merchant',
      updated_at: config?.updated_at,
      last_synced_at: config?.last_synced_at || null,
      sync_error: config?.sync_error || null,
      source: 'Razorpay Test Mode',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/data/daily-summaries
router.get('/daily-summaries', (req, res) => {
  try {
    const db = getDb();
    const { days = 90 } = req.query;
    const summaries = db.prepare(`
      SELECT * FROM daily_summaries 
      ORDER BY date DESC 
      LIMIT ?
    `).all(parseInt(days));
    const meta = db.prepare('SELECT last_synced_at, sync_error FROM merchants WHERE id = 1').get();
    res.json({
      summaries: summaries.reverse(),
      source: 'Razorpay Test Mode',
      last_synced_at: meta?.last_synced_at || null,
      sync_error: meta?.sync_error || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
