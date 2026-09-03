const express = require('express');
const router = express.Router();
const {
  connectCredentials,
  getConnectionStatus,
  syncRazorpayData,
  createTestPaymentLinks,
} = require('../services/razorpayService');
const { broadcastEvent } = require('../services/eventService');

router.get('/status', (req, res) => {
  try {
    res.json(getConnectionStatus());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/connect', async (req, res) => {
  try {
    const status = await connectCredentials(req.body || {});
    res.json(status);
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message });
  }
});

router.post('/sync', async (req, res) => {
  try {
    const result = await syncRazorpayData();
    broadcastEvent('DATA_SYNCED', result);
    res.json(result);
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message });
  }
});

router.post('/seed-payment-links', async (req, res) => {
  try {
    const links = await createTestPaymentLinks(req.body?.count || 5);
    res.json({
      message: 'Created real Razorpay Test Mode payment links. Pay them with Razorpay test cards/UPI, then run Sync.',
      links,
    });
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message });
  }
});

module.exports = router;
