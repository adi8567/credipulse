const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { getDb } = require('../db/init');
const { seedDemoData } = require('../data/seeder');
const { broadcastEvent } = require('../services/eventService');
const { assessRisk } = require('../services/riskService');
const { generateForecast } = require('../services/forecastService');

// POST /api/webhooks/razorpay - Handles real Razorpay webhooks
router.post('/razorpay', (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (webhookSecret && signature) {
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');
      if (digest !== signature) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;
    const db = getDb();

    if (event === 'payment.captured' && payload?.payment?.entity) {
      const payment = payload.payment.entity;
      const amount = payment.amount / 100;
      const id = `tx_live_${payment.id}`;

      db.prepare(`
        INSERT OR IGNORE INTO transactions
        (id, order_id, payment_id, amount, currency, status, method, description, created_at, settled_at, settlement_id, is_demo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(
        id,
        payment.order_id || `order_${payment.id}`,
        payment.id,
        amount,
        payment.currency || 'INR',
        payment.status,
        payment.method,
        payment.description || 'Live Razorpay Payment',
        new Date(payment.created_at * 1000).toISOString(),
        null,
        null
      );

      // Update merchant balance
      db.prepare(`UPDATE merchant_config SET current_balance = current_balance + ?, updated_at = datetime('now') WHERE id = 1`).run(amount);
      db.prepare(`UPDATE merchants SET current_balance = current_balance + ?, updated_at = datetime('now') WHERE id = 1`).run(amount);
    } else if (event === 'settlement.processed' && payload?.settlement?.entity) {
      const settlement = payload.settlement.entity;
      const id = `setl_live_${settlement.id}`;

      db.prepare(`
        INSERT OR IGNORE INTO settlements
        (id, amount, fees, tax, net_amount, settled_at, utr, is_demo)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `).run(
        id,
        settlement.amount / 100,
        (settlement.fees || 0) / 100,
        (settlement.tax || 0) / 100,
        (settlement.amount - (settlement.fees || 0) - (settlement.tax || 0)) / 100,
        new Date(settlement.created_at * 1000).toISOString(),
        settlement.utr || 'UTR-LIVE'
      );
    }

    // Broadcast update to connected frontend clients
    const risk = assessRisk();
    const forecast = generateForecast();
    broadcastEvent('DATA_UPDATED', { event, risk, forecastSummary: { count: forecast.forecast?.length || 0 } });

    res.json({ status: 'ok', received_event: event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/webhooks/simulate-incoming - Simulated payment for interactive demo
router.post('/simulate-incoming', (req, res) => {
  try {
    const { amount = 15000, description = 'Simulated Customer Payment', method = 'upi' } = req.body;
    const db = getDb();
    const txId = `tx_sim_${Date.now()}`;
    const paymentId = `pay_sim_${Date.now()}`;
    const nowISO = new Date().toISOString();

    db.prepare(`
      INSERT INTO transactions
      (id, order_id, payment_id, amount, currency, status, method, description, created_at, settled_at, settlement_id, is_demo)
      VALUES (?, ?, ?, ?, 'INR', 'captured', ?, ?, ?, ?, NULL, 1)
    `).run(
      txId,
      `order_sim_${Date.now()}`,
      paymentId,
      amount,
      method,
      description,
      nowISO,
      new Date(Date.now() + 86400000).toISOString()
    );

    db.prepare(`UPDATE merchant_config SET current_balance = current_balance + ?, updated_at = datetime('now') WHERE id = 1`).run(amount);
    db.prepare(`UPDATE merchants SET current_balance = current_balance + ?, updated_at = datetime('now') WHERE id = 1`).run(amount);

    const risk = assessRisk();
    const forecast = generateForecast();
    broadcastEvent('DATA_UPDATED', { type: 'payment_simulated', amount, risk, forecast });

    res.json({ message: 'Payment simulated successfully', amount, transaction_id: txId, new_risk: risk });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/webhooks/reset-demo - Resets DB back to the exact Thursday high-risk state
router.post('/reset-demo', (req, res) => {
  try {
    seedDemoData(true);
    const risk = assessRisk();
    const forecast = generateForecast();
    broadcastEvent('DATA_RESET', { message: 'Demo data reset to Thursday risk scenario', risk, forecast });
    res.json({ message: 'Demo scenario reset successfully', risk });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
