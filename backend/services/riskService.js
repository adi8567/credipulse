/**
 * Liquidity Risk Engine
 * 
 * Detects when the projected balance falls below the safety buffer
 * and classifies overall risk level.
 */

const { getDb } = require('../db/init');
const { generateForecast } = require('./forecastService');

/**
 * Analyze forecast for liquidity risks
 * @param {Array} [forecastData] - Optional pre-computed forecast (avoids double computation)
 * @param {number} [balanceOverride] - For simulator
 */
function assessRisk(forecastData = null, balanceOverride = null) {
  const db = getDb();
  const config = db.prepare('SELECT * FROM merchants WHERE id = 1').get();
  const safetyBuffer = config?.safety_buffer || 15000;
  const currentBalance = balanceOverride !== null ? balanceOverride : (config?.current_balance || 0);

  const forecastResult = forecastData || generateForecast(balanceOverride);
  const forecast = Array.isArray(forecastResult) ? forecastResult : forecastResult.forecast;

  if (!forecast.length) {
    return {
      overall_risk: 'UNKNOWN',
      current_balance: currentBalance,
      safety_buffer: safetyBuffer,
      health_score: 0,
      has_breach: false,
      breach_count: 0,
      first_breach: null,
      min_projected_balance: currentBalance,
      max_liquidity_gap: 0,
      forecast_window_days: 0,
      source: 'Razorpay Test Mode',
      last_synced_at: config?.last_synced_at || null,
      message: forecastResult.message || 'Insufficient Razorpay transaction history.',
      assessed_at: new Date().toISOString(),
    };
  }

  // Find first breach day
  const breachDays = forecast.filter(d => d.projected_balance_low < safetyBuffer);
  const firstBreach = breachDays[0] || null;
  const settlementCycleGaps = forecast
    .filter((d) => d.projected_balance_low < safetyBuffer)
    .map((d) => ({
      date: d.date,
      day_of_week: d.day_of_week,
      low_balance: d.projected_balance_low,
      base_balance: d.projected_balance,
      high_balance: d.projected_balance_high,
      expected_settlement_credit: d.expected_settlement_credit,
      gap_low_case: Math.max(0, safetyBuffer - d.projected_balance_low),
    }));

  // Determine overall risk level
  let overallRisk = 'HEALTHY';
  if (firstBreach) {
    const daysUntilBreach = firstBreach.day_number;
    if (daysUntilBreach <= 3) overallRisk = 'HIGH_RISK';
    else if (daysUntilBreach <= 7) overallRisk = 'WATCH';
    else overallRisk = 'WATCH';
  }

  // Minimum projected balance in window
  const minProjected = Math.min(...forecast.map(d => d.projected_balance));
  const maxGap = Math.max(...forecast.map(d => d.gap_from_buffer));

  // Health score: 0-100
  // 100 = well above buffer, 0 = severely below
  const healthScore = Math.max(0, Math.min(100,
    Math.round(((currentBalance - safetyBuffer) / safetyBuffer) * 50 + 50)
  ));

  return {
    overall_risk: overallRisk,
    current_balance: currentBalance,
    safety_buffer: safetyBuffer,
    health_score: healthScore,
    has_breach: breachDays.length > 0,
    breach_count: breachDays.length,
    first_breach: firstBreach ? {
      date: firstBreach.date,
      day_of_week: firstBreach.day_of_week,
      day_number: firstBreach.day_number,
      projected_balance: firstBreach.projected_balance,
      projected_balance_low: firstBreach.projected_balance_low,
      projected_balance_high: firstBreach.projected_balance_high,
      liquidity_gap: Math.max(0, safetyBuffer - firstBreach.projected_balance_low),
    } : null,
    min_projected_balance: Math.round(minProjected),
    max_liquidity_gap: Math.round(Math.max(0, maxGap)),
    settlement_cycle_liquidity_gaps: settlementCycleGaps,
    razorpay_native_feature: 'Settlement-cycle-aware liquidity gap detection',
    forecast_window_days: forecast.length,
    source: 'Razorpay Test Mode',
    last_synced_at: config?.last_synced_at || null,
    assessed_at: new Date().toISOString(),
  };
}

module.exports = { assessRisk };
