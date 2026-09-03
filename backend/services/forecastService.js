const { getDb } = require('../db/init');
const { calcDayOfWeekPattern, calcTrend, getDailySummaries } = require('./analysisService');

function ewma(values, alpha = 0.35) {
  if (!values.length) return 0;
  let result = values[0];
  for (let i = 1; i < values.length; i++) {
    result = alpha * values[i] + (1 - alpha) * result;
  }
  return result;
}

function stdDev(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function estimateSettlementDelayDays() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT julianday(settled_at) - julianday(created_at) as delay
    FROM transactions
    WHERE is_demo = 0 AND settled_at IS NOT NULL
  `).all();
  if (!rows.length) return 2;
  const avg = rows.reduce((sum, row) => sum + Number(row.delay || 0), 0) / rows.length;
  return Math.max(1, Math.round(avg));
}

function estimateFeeRate() {
  const db = getDb();
  const row = db.prepare(`
    SELECT SUM(fee + tax) as fees, SUM(amount) as amount
    FROM transactions
    WHERE is_demo = 0 AND status = 'captured'
  `).get();
  if (!row?.amount) return 0.024;
  return Math.max(0, Math.min(0.08, Number(row.fees || 0) / Number(row.amount)));
}

function getUnsettledCaptured() {
  return getDb().prepare(`
    SELECT amount, fee, tax, created_at
    FROM transactions
    WHERE is_demo = 0 AND status = 'captured' AND settled_at IS NULL
  `).all();
}

function generateForecast(balanceOverride = null) {
  const db = getDb();
  const config = db.prepare('SELECT * FROM merchants WHERE id = 1').get();
  const txCount = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE is_demo = 0').get().count;
  const currentBalance = balanceOverride !== null ? balanceOverride : Number(config?.current_balance || 0);
  const safetyBuffer = Number(config?.safety_buffer || 15000);
  const lastSyncedAt = config?.last_synced_at || null;

  if (txCount === 0) {
    return {
      status: 'insufficient_data',
      message: 'Connect Razorpay and sync at least one captured payment to generate a forecast.',
      horizon_days: 14,
      source: 'Razorpay Test Mode',
      last_synced_at: lastSyncedAt,
      forecast: [],
    };
  }

  const summaries = getDailySummaries(30);
  const inflows = summaries.map((s) => Number(s.total_inflow || 0));
  const fees = summaries.map((s) => Number(s.total_outflow || 0));
  const baseGrossInflow = ewma(inflows.slice(-14), 0.35);
  const baseFees = ewma(fees.slice(-14), 0.35);
  const volatility = stdDev(inflows.slice(-14));
  const feeRate = estimateFeeRate();
  const delayDays = estimateSettlementDelayDays();
  const dowMultipliers = calcDayOfWeekPattern();
  const trend = calcTrend();
  const trendMultiplier = trend.direction === 'up' ? 1 + Math.min(0.25, Math.abs(trend.trend_pct || 0) / 100) :
    trend.direction === 'down' ? 1 - Math.min(0.25, Math.abs(trend.trend_pct || 0) / 100) : 1;

  const pendingSettlements = new Map();
  for (const tx of getUnsettledCaptured()) {
    const settleDate = new Date(tx.created_at);
    settleDate.setDate(settleDate.getDate() + delayDays);
    settleDate.setHours(0, 0, 0, 0);
    const key = settleDate.toISOString().split('T')[0];
    const net = Number(tx.amount || 0) - Number(tx.fee || 0) - Number(tx.tax || 0);
    pendingSettlements.set(key, (pendingSettlements.get(key) || 0) + net);
  }

  const forecast = [];
  let lowBalance = currentBalance;
  let baseBalance = currentBalance;
  let highBalance = currentBalance;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 1; i <= 14; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i);
    const date = forecastDate.toISOString().split('T')[0];
    const dow = forecastDate.getDay();
    const seasonalGross = baseGrossInflow * (dowMultipliers[dow] || 1) * trendMultiplier;
    const lowGross = Math.max(0, seasonalGross - volatility * 0.5);
    const highGross = Math.max(0, seasonalGross + volatility * 0.5);
    const feeOutflow = Math.max(baseFees, seasonalGross * feeRate);
    const pending = pendingSettlements.get(date) || 0;

    const settleDate = new Date(forecastDate);
    settleDate.setDate(forecastDate.getDate() + delayDays);
    const futureSettleKey = settleDate.toISOString().split('T')[0];
    pendingSettlements.set(
      futureSettleKey,
      (pendingSettlements.get(futureSettleKey) || 0) + Math.max(0, seasonalGross - feeOutflow)
    );

    lowBalance += pending + Math.max(0, lowGross - lowGross * feeRate) - feeOutflow;
    baseBalance += pending + Math.max(0, seasonalGross - feeOutflow) - feeOutflow;
    highBalance += pending + Math.max(0, highGross - highGross * feeRate) - feeOutflow;

    const projected = Math.round(baseBalance);
    const low = Math.round(Math.min(lowBalance, baseBalance, highBalance));
    const high = Math.round(Math.max(lowBalance, baseBalance, highBalance));
    const gapFromBuffer = safetyBuffer - projected;
    const riskLevel =
      low < safetyBuffer ? 'HIGH_RISK' :
      projected < safetyBuffer * 1.25 ? 'WATCH' : 'HEALTHY';

    forecast.push({
      date,
      day_of_week: dayNames[dow],
      day_number: i,
      predicted_inflow: Math.round(seasonalGross),
      predicted_outflow: Math.round(feeOutflow),
      expected_settlement_credit: Math.round(pending),
      net_flow: Math.round(seasonalGross - feeOutflow),
      projected_balance: projected,
      projected_balance_low: low,
      projected_balance_high: high,
      safety_buffer: safetyBuffer,
      gap_from_buffer: Math.round(gapFromBuffer),
      risk_level: riskLevel,
      model: 'EWMA + day-of-week seasonality + settlement-delay adjustment',
    });
  }

  return {
    status: 'ok',
    horizon_days: 14,
    source: 'Razorpay Test Mode',
    last_synced_at: lastSyncedAt,
    model: {
      name: 'EWMA + settlement cycle',
      settlement_delay_days: delayDays,
      fee_rate: feeRate,
      sample_transactions: txCount,
    },
    forecast,
  };
}

module.exports = { generateForecast };
