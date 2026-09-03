const express = require('express');
const router = express.Router();
const {
  getAnalysisSummary,
  getDailySummaries,
  calcAverageInflow,
  calcAverageOutflow,
  calcDayOfWeekPattern,
  calcSettlementBehavior,
  calcVolatility,
  calcTrend,
} = require('../services/analysisService');

// GET /api/analysis/summary
router.get('/summary', (req, res) => {
  try {
    const summary = getAnalysisSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analysis/historical
router.get('/historical', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;
    const summaries = getDailySummaries(days);
    res.json({ summaries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
