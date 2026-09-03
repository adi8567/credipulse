const { getDb } = require('../db/init');
const { getAnalysisSummary } = require('./analysisService');
const { generateForecast } = require('./forecastService');
const { assessRisk } = require('./riskService');

const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function getApiKey() {
  return process.env.GEMINI_API_KEY;
}

function buildContext() {
  const db = getDb();
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = 1').get();
  const analysis = getAnalysisSummary();
  const forecastResult = generateForecast();
  const forecast = forecastResult.forecast || [];
  const risk = assessRisk(forecastResult);

  return {
    merchant: {
      name: merchant?.merchant_name || 'Connected Merchant',
      current_balance: risk.current_balance,
      safety_buffer: risk.safety_buffer,
      health_score: risk.health_score,
    },
    risk: {
      level: risk.overall_risk,
      has_breach: risk.has_breach,
      breach_date: risk.first_breach?.date,
      breach_day_of_week: risk.first_breach?.day_of_week,
      breach_projected_balance: risk.first_breach?.projected_balance,
      liquidity_gap: risk.first_breach?.liquidity_gap,
    },
    analysis: {
      avg_daily_inflow: Math.round(analysis.inflow.avg_inflow || 0),
      avg_daily_outflow: Math.round(analysis.outflow.avg_outflow || 0),
      net_daily_avg: analysis.net_daily_avg,
      trend_direction: analysis.trend.direction,
      trend_pct: analysis.trend.trend_pct,
      volatility_cv: analysis.volatility.cv,
      avg_settlement_delay_days: analysis.settlement.avg_delay,
      transaction_count: analysis.transaction_count,
    },
    source: forecastResult.source,
    last_synced_at: forecastResult.last_synced_at,
    forecast_status: forecastResult.status,
    forecast_message: forecastResult.message,
    forecast_next_4_days: forecast.slice(0, 4).map((d) => ({
      date: d.date,
      day: d.day_of_week,
      projected_balance: d.projected_balance,
      projected_balance_low: d.projected_balance_low,
      projected_balance_high: d.projected_balance_high,
      inflow: d.predicted_inflow,
      outflow: d.predicted_outflow,
      settlement_credit: d.expected_settlement_credit,
    })),
  };
}

async function generateInsights() {
  const context = buildContext();
  const apiKey = getApiKey();
  if (!apiKey) return generateComputedInsights(context);

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildInsightPrompt(context) }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) return generateComputedInsights(context);
    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return generateComputedInsights(context);
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return {
      ...parsed,
      context,
      source: 'gemini',
      model: GEMINI_MODEL,
      generated_at: new Date().toISOString(),
    };
  } catch (err) {
    return generateComputedInsights(context);
  }
}

function buildInsightPrompt(ctx) {
  return `You are CreditPulse, a financial intelligence assistant for small merchants.
Only narrate the exact computed data below. Do not invent amounts, dates, products, suppliers, or recommendations based on unavailable data.
Return valid JSON with exactly: what_is_happening, why_it_is_happening, what_to_do.

COMPUTED DATA:
${JSON.stringify(ctx, null, 2)}`;
}

function generateComputedInsights(context) {
  if (context.forecast_status !== 'ok') {
    return {
      what_is_happening: context.forecast_message || 'There is not enough synced Razorpay transaction history to compute a forecast.',
      why_it_is_happening: 'CreditPulse does not use demo values when Razorpay data is missing.',
      what_to_do: 'Connect Razorpay Test Mode, create and pay real test payment links, then sync again.',
      context,
      source: 'computed_template',
      generated_at: new Date().toISOString(),
    };
  }

  const balance = context.merchant.current_balance.toLocaleString('en-IN');
  const buffer = context.merchant.safety_buffer.toLocaleString('en-IN');
  const avgInflow = context.analysis.avg_daily_inflow.toLocaleString('en-IN');
  const first = context.forecast_next_4_days[0];

  if (context.risk.has_breach) {
    return {
      what_is_happening: `Your computed balance is INR ${balance}. The forecast range shows a first buffer breach on ${context.risk.breach_day_of_week} (${context.risk.breach_date}) with a projected balance of INR ${context.risk.breach_projected_balance?.toLocaleString('en-IN')}.`,
      why_it_is_happening: `The model is using ${context.analysis.transaction_count} synced Razorpay transactions, average daily inflow of INR ${avgInflow}, and settlement timing from the synced payment history.`,
      what_to_do: `Use the simulator to test capital above the INR ${context.risk.liquidity_gap?.toLocaleString('en-IN')} liquidity gap, then re-sync after additional Razorpay payments settle.`,
      context,
      source: 'computed_template',
      generated_at: new Date().toISOString(),
    };
  }

  return {
    what_is_happening: `Your computed balance is INR ${balance}, above the INR ${buffer} safety buffer. The next forecast point projects INR ${first?.projected_balance?.toLocaleString('en-IN')} with a range of INR ${first?.projected_balance_low?.toLocaleString('en-IN')} to INR ${first?.projected_balance_high?.toLocaleString('en-IN')}.`,
    why_it_is_happening: `The model is using Razorpay Test Mode transactions, daily inflow seasonality, fees/taxes, and estimated settlement delay from the synced records.`,
    what_to_do: 'Keep syncing after new test payments and use the range, not a single point, when planning near-buffer expenses.',
    context,
    source: 'computed_template',
    generated_at: new Date().toISOString(),
  };
}

async function getChatResponse(message, history = []) {
  const context = buildContext();
  const apiKey = getApiKey();
  if (!apiKey) return getComputedChatResponse(message, context);

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{
            text: `Answer using only this computed CreditPulse context. Never invent numbers.\n${JSON.stringify(context, null, 2)}`,
          }],
        },
        contents: [
          ...history.map((h) => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
          { role: 'user', parts: [{ text: message }] },
        ],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    });
    if (!response.ok) return getComputedChatResponse(message, context);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? { reply: text, source: 'gemini', model: GEMINI_MODEL } : getComputedChatResponse(message, context);
  } catch (err) {
    return getComputedChatResponse(message, context);
  }
}

function getComputedChatResponse(message, ctx) {
  if (ctx.forecast_status !== 'ok') {
    return {
      reply: ctx.forecast_message || 'I need synced Razorpay Test Mode payments before I can answer with computed cash-flow numbers.',
      source: 'computed_template',
    };
  }

  if (message.toLowerCase().includes('settlement')) {
    return {
      reply: `The forecast uses the synced settlement delay and pending captured payments. Your current average settlement delay is ${ctx.analysis.avg_settlement_delay_days} days, and settlement credits appear as their own forecast line.`,
      source: 'computed_template',
    };
  }

  return {
    reply: `Your current computed balance is INR ${ctx.merchant.current_balance.toLocaleString('en-IN')}; risk is ${ctx.risk.level}. The forecast is based on ${ctx.analysis.transaction_count} synced Razorpay Test Mode transactions and uses low/base/high ranges.`,
    source: 'computed_template',
  };
}

module.exports = { generateInsights, getChatResponse, buildContext };
