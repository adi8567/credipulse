const express = require('express');
const router = express.Router();
const { assessRisk } = require('../services/riskService');
const { getDb } = require('../db/init');

// GET /api/risk
router.get('/', (req, res) => {
  try {
    const risk = assessRisk();
    res.json(risk);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/risk/buffer - Update safety buffer
router.post('/buffer', (req, res) => {
  try {
    const { safety_buffer } = req.body;
    if (typeof safety_buffer !== 'number' || safety_buffer < 0) {
      return res.status(400).json({ error: 'Invalid safety buffer amount' });
    }
    const db = getDb();
    db.prepare(`UPDATE merchant_config SET safety_buffer = ?, updated_at = datetime('now') WHERE id = 1`).run(safety_buffer);
    db.prepare(`UPDATE merchants SET safety_buffer = ?, updated_at = datetime('now') WHERE id = 1`).run(safety_buffer);
    const updatedRisk = assessRisk();
    res.json({ message: 'Safety buffer updated', risk: updatedRisk });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
