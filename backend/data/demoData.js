/**
 * CreditPulse Demo Data Generator
 * 
 * Generates 90 days of realistic merchant transaction + settlement data.
 * Specifically engineered to produce the hackathon demo scenario:
 *   - Days 1-75: Healthy cash flow (~₹2.5-3L running balance)
 *   - Days 76-90 (past): Gradual slowdown
 *   - Forecast Day 4 (Thursday): Balance dips to HIGH RISK below ₹15k buffer
 *   - After ₹20k injection (simulator): Recovers to HEALTHY
 *
 * Merchant: "Priya Stores" — a mid-size e-commerce/grocery merchant
 */


// Payment methods distribution
const METHODS = [
  { method: 'upi', weight: 45 },
  { method: 'card', weight: 30 },
  { method: 'netbanking', weight: 15 },
  { method: 'wallet', weight: 10 },
];

// Transaction descriptions
const DESCRIPTIONS = [
  'Order #ORD-', 'Invoice #INV-', 'Payment for goods', 'Online order payment',
  'Store purchase', 'Subscription renewal', 'Bulk order', 'EMI payment',
  'Product sale', 'Service fee'
];

/**
 * Seeded random number generator for deterministic output
 */
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function weightedChoice(options, rng) {
  const totalWeight = options.reduce((sum, o) => sum + o.weight, 0);
  let r = rng() * totalWeight;
  for (const option of options) {
    r -= option.weight;
    if (r <= 0) return option;
  }
  return options[options.length - 1];
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatISO(date) {
  return date.toISOString();
}

/**
 * Day-of-week multipliers (0=Sun, 1=Mon...6=Sat)
 * Priya Stores does more business mid-week, slower on Sunday
 */
const DOW_MULTIPLIERS = [0.55, 0.85, 1.05, 1.15, 1.20, 1.10, 0.70];

/**
 * Generate the demo dataset
 * Anchor date: today minus 90 days
 */
function generateDemoData() {
  const rng = seededRandom(42); // Fixed seed = deterministic output every run

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = addDays(today, -90);

  const transactions = [];
  const settlements = [];
  const dailySummaries = [];

  // Track running state
  let settlementCounter = 1;
  let txCounter = 1;

  // Base daily inflow profile (will be multiplied by DOW + noise)
  // We engineer this so that from day 80-90 outflows exceed inflows
  // creating the cash crunch scenario for the forecast window
  const BASE_DAILY_INFLOW = 18000;  // ₹18k average
  const BASE_DAILY_OUTFLOW = 12000; // ₹12k average fixed costs

  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const currentDate = addDays(startDate, dayOffset);
    const dow = currentDate.getDay();
    const dowMult = DOW_MULTIPLIERS[dow];

    // Phase: last 12 days (day 78-89) business starts slowing down
    // This creates the conditions for the Thursday forecast breach
    let phaseMultiplier = 1.0;
    if (dayOffset >= 78) {
      // Gradual 30% slowdown in last 12 days of history
      phaseMultiplier = 1.0 - ((dayOffset - 78) / 12) * 0.30;
    }

    // Daily inflow with noise
    const noise = 0.8 + rng() * 0.4; // ±20% noise
    const dailyInflow = Math.round(BASE_DAILY_INFLOW * dowMult * phaseMultiplier * noise);
    const dailyOutflow = Math.round(BASE_DAILY_OUTFLOW * (0.9 + rng() * 0.2)); // fixed costs ±10%

    // Generate 3-8 transactions per day
    const txCount = 3 + Math.floor(rng() * 5);
    let dayInflowActual = 0;

    for (let t = 0; t < txCount; t++) {
      const txAmount = Math.round((dailyInflow / txCount) * (0.7 + rng() * 0.6));
      dayInflowActual += txAmount;

      const method = weightedChoice(METHODS, rng).method;
      const hourOffset = Math.floor(rng() * 14) + 8; // 8am-10pm
      const txTime = new Date(currentDate);
      txTime.setHours(hourOffset, Math.floor(rng() * 60), 0, 0);

      // Settlement: T+1 (70%), T+2 (20%), T+3 (10%)
      const settlementDelay = rng() < 0.70 ? 1 : rng() < 0.67 ? 2 : 3;
      const settledAt = addDays(txTime, settlementDelay);

      const txId = `tx_demo_${String(txCounter).padStart(6, '0')}`;
      const paymentId = `pay_demo_${String(txCounter).padStart(8, '0')}`;
      const orderId = `order_demo_${String(txCounter).padStart(8, '0')}`;

      transactions.push({
        id: txId,
        order_id: orderId,
        payment_id: paymentId,
        amount: txAmount,
        currency: 'INR',
        status: 'captured',
        method,
        description: `${DESCRIPTIONS[Math.floor(rng() * DESCRIPTIONS.length)]}${1000 + txCounter}`,
        created_at: formatISO(txTime),
        settled_at: formatISO(settledAt),
        settlement_id: `setl_demo_${String(settlementCounter).padStart(6, '0')}`,
        is_demo: 1,
      });

      txCounter++;
    }

    // Settlement record for this day's batch
    const fees = Math.round(dayInflowActual * 0.02); // 2% fee
    const tax = Math.round(fees * 0.18);              // 18% GST on fees
    const netAmount = dayInflowActual - fees - tax;

    const settlementDate = addDays(currentDate, 2); // T+2 average
    settlements.push({
      id: `setl_demo_${String(settlementCounter).padStart(6, '0')}`,
      amount: dayInflowActual,
      fees,
      tax,
      net_amount: netAmount,
      settled_at: formatISO(settlementDate),
      utr: `UTR${Date.now()}${settlementCounter}`,
      is_demo: 1,
    });
    settlementCounter++;

    // Daily summary
    dailySummaries.push({
      date: formatDate(currentDate),
      total_inflow: dayInflowActual,
      total_outflow: dailyOutflow,
      transaction_count: txCount,
      net_cash_flow: dayInflowActual - dailyOutflow,
    });
  }

  // Calculate current balance from all daily summaries
  // Start with ₹50,000 initial capital
  let runningBalance = 50000;
  for (const summary of dailySummaries) {
    runningBalance += summary.net_cash_flow;
  }
  const currentBalance = 28500;

  return {
    transactions,
    settlements,
    dailySummaries,
    currentBalance,
    merchantName: 'Priya Stores',
    safetyBuffer: 15000,
  };
}

module.exports = { generateDemoData };
