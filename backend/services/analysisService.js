/**
 * Cash Flow Analysis Service
 * 
 * Analyzes historical transaction data to extract:
 * - Average daily inflows/outflows
 * - Day-of-week patterns
 * - Settlement behavior
 * - Cash flow volatility
 */

const { getDb } = require('../db/init');

/**
 * Get last N days of daily summaries
 */
function getDailySummaries(days = 90) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM daily_summaries 
    ORDER BY date DESC
    LIMIT ?
  `).all(days).reverse();
}

/**
 * Calculate average daily inflow over the last N days
 */
function calcAverageInflow(days = 30) {
  const db = getDb();
  const result = db.prepare(`
    SELECT AVG(total_inflow) as avg_inflow, 
           MIN(total_inflow) as min_inflow,
           MAX(total_inflow) as max_inflow
    FROM (
      SELECT total_inflow FROM daily_summaries 
      ORDER BY date DESC LIMIT ?
    )
  `).get(days);
  return result || { avg_inflow: 0, min_inflow: 0, max_inflow: 0 };
}

/**
 * Calculate average daily outflow over the last N days
 */
function calcAverageOutflow(days = 30) {
  const db = getDb();
  const result = db.prepare(`
    SELECT AVG(total_outflow) as avg_outflow,
           MIN(total_outflow) as min_outflow,
           MAX(total_outflow) as max_outflow
    FROM (
      SELECT total_outflow FROM daily_summaries 
      ORDER BY date DESC LIMIT ?
    )
  `).get(days);
  return result || { avg_outflow: 0, min_outflow: 0, max_outflow: 0 };
}

/**
 * Calculate day-of-week multipliers based on historical performance
 * Returns an array [Sun, Mon, Tue, Wed, Thu, Fri, Sat] of relative multipliers
 */
function calcDayOfWeekPattern() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT 
      CAST(strftime('%w', date) AS INTEGER) as dow,
      AVG(total_inflow) as avg_inflow
    FROM daily_summaries
    GROUP BY dow
    ORDER BY dow
  `).all();

  if (!rows.length) return [1,1,1,1,1,1,1];

  const overallAvg = rows.reduce((sum, r) => sum + r.avg_inflow, 0) / rows.length;
  const multipliers = Array(7).fill(1);
  
  for (const row of rows) {
    if (overallAvg > 0) {
      multipliers[row.dow] = row.avg_inflow / overallAvg;
    }
  }
  return multipliers;
}

/**
 * Calculate average settlement delay in days
 */
function calcSettlementBehavior() {
  const db = getDb();
  // Count transactions by settlement delay bucket
  const delays = db.prepare(`
    SELECT 
      ROUND(julianday(settled_at) - julianday(created_at)) as delay_days,
      COUNT(*) as count
    FROM transactions
    WHERE settled_at IS NOT NULL AND is_demo = 0
    GROUP BY delay_days
    ORDER BY delay_days
  `).all();

  if (!delays.length) return { avg_delay: 0, t1_pct: 0, t2_pct: 0, t3_pct: 0 };

  const total = delays.reduce((sum, d) => sum + d.count, 0);
  const weightedSum = delays.reduce((sum, d) => sum + (d.delay_days * d.count), 0);
  const avgDelay = total > 0 ? weightedSum / total : 1.5;

  const t1 = delays.find(d => d.delay_days === 1);
  const t2 = delays.find(d => d.delay_days === 2);
  const t3 = delays.find(d => d.delay_days >= 3);

  return {
    avg_delay: Math.round(avgDelay * 10) / 10,
    t1_pct: t1 ? Math.round((t1.count / total) * 100) : 0,
    t2_pct: t2 ? Math.round((t2.count / total) * 100) : 0,
    t3_pct: t3 ? Math.round((t3.count / total) * 100) : 0,
  };
}

/**
 * Calculate cash flow volatility (coefficient of variation)
 */
function calcVolatility(days = 30) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT total_inflow FROM daily_summaries
    ORDER BY date DESC LIMIT ?
  `).all(days);

  if (rows.length < 2) return { cv: 0, std_dev: 0, mean: 0 };

  const values = rows.map(r => r.total_inflow);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

  return {
    cv: Math.round(cv),
    std_dev: Math.round(stdDev),
    mean: Math.round(mean),
  };
}

/**
 * Get recent trend: positive = inflow growing, negative = inflow shrinking
 * Compares last 7 days vs previous 7 days
 */
function calcTrend() {
  const db = getDb();
  const recent7 = db.prepare(`
    SELECT AVG(total_inflow) as avg FROM daily_summaries ORDER BY date DESC LIMIT 7
  `).get();
  const prev7 = db.prepare(`
    SELECT AVG(total_inflow) as avg FROM (
      SELECT total_inflow FROM daily_summaries ORDER BY date DESC LIMIT 14
    ) LIMIT 7 OFFSET 7
  `).get();

  if (!recent7 || !prev7 || prev7.avg === 0) return { trend_pct: 0, direction: 'stable' };

  const trendPct = ((recent7.avg - prev7.avg) / prev7.avg) * 100;
  return {
    trend_pct: Math.round(trendPct * 10) / 10,
    direction: trendPct > 2 ? 'up' : trendPct < -2 ? 'down' : 'stable',
    recent_7_avg: Math.round(recent7.avg),
    prev_7_avg: Math.round(prev7.avg),
  };
}

/**
 * Full analysis summary — single call that returns everything
 */
function getAnalysisSummary() {
  const inflow = calcAverageInflow(30);
  const outflow = calcAverageOutflow(30);
  const dowPattern = calcDayOfWeekPattern();
  const settlement = calcSettlementBehavior();
  const volatility = calcVolatility(30);
  const trend = calcTrend();
  const db = getDb();
  const meta = db.prepare('SELECT last_synced_at, sync_error FROM merchants WHERE id = 1').get();
  const total = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE is_demo = 0').get();

  return {
    inflow,
    outflow,
    net_daily_avg: Math.round((inflow.avg_inflow || 0) - (outflow.avg_outflow || 0)),
    dow_pattern: dowPattern,
    settlement,
    volatility,
    trend,
    transaction_count: total?.count || 0,
    source: 'Razorpay Test Mode',
    last_synced_at: meta?.last_synced_at || null,
    sync_error: meta?.sync_error || null,
    generated_at: new Date().toISOString(),
  };
}

module.exports = {
  getDailySummaries,
  calcAverageInflow,
  calcAverageOutflow,
  calcDayOfWeekPattern,
  calcSettlementBehavior,
  calcVolatility,
  calcTrend,
  getAnalysisSummary,
};
