const express = require('express');
const router = express.Router();
const { generateForecast } = require('../services/forecastService');

// GET /api/forecast
router.get('/', (req, res) => {
  try {
    const result = generateForecast();
    res.json({ ...result, generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
