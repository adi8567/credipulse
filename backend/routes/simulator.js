const express = require('express');
const router = express.Router();
const { getDb } = require('../db/init');
const { generateForecast } = require('../services/forecastService');
const { assessRisk } = require('../services/riskService');

// POST /api/simulator/simulate
router.post('/simulate', (req, res) => {
  try {
    const { advance_amount = 20000 } = req.body;
    const amount = Number(advance_amount) || 0;

    const db = getDb();
    const config = db.prepare('SELECT * FROM merchants WHERE id = 1').get();
    const currentBalance = config?.current_balance || 0;
    const safetyBuffer = config?.safety_buffer || 15000;

    // Baseline calculation (without advance)
    const baselineForecastResult = generateForecast(currentBalance);
    const baselineForecast = baselineForecastResult.forecast || [];
    const baselineRisk = assessRisk(baselineForecastResult, currentBalance);

    // Simulated calculation (with advance added to current balance)
    const simulatedBalance = currentBalance + amount;
    const simulatedForecastResult = generateForecast(simulatedBalance);
    const simulatedForecast = simulatedForecastResult.forecast || [];
    const simulatedRisk = assessRisk(simulatedForecastResult, simulatedBalance);

    // Improvement metrics
    const baselineMin = baselineRisk.min_projected_balance;
    const simulatedMin = simulatedRisk.min_projected_balance;
    const balanceImprovement = simulatedMin - baselineMin;
    const riskResolved = baselineRisk.has_breach && !simulatedRisk.has_breach;

    res.json({
      advance_amount: amount,
      current_balance: currentBalance,
      simulated_balance: simulatedBalance,
      safety_buffer: safetyBuffer,
      baseline: {
        forecast: baselineForecast,
        risk: baselineRisk,
      },
      simulated: {
        forecast: simulatedForecast,
        risk: simulatedRisk,
      },
      impact: {
        risk_resolved: riskResolved,
        baseline_risk_level: baselineRisk.overall_risk,
        simulated_risk_level: simulatedRisk.overall_risk,
        balance_boost: amount,
        minimum_balance_improvement: balanceImprovement,
        days_safe_added: (baselineRisk.breach_count || 0) - (simulatedRisk.breach_count || 0),
      },
      disclaimer: 'SIMULATION ONLY: CreditPulse does not offer, originate, or guarantee credit facilities.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
