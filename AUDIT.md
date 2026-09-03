# CreditPulse Audit

Date: 2026-09-02

## Data Source Rules After Audit

- Live source: Razorpay Test Mode via the official `razorpay` Node SDK.
- Persistent store: local SQLite through `node:sqlite`.
- Credentials: Razorpay key secret is AES-256-GCM encrypted in the `merchants` table.
- No live dashboard route intentionally falls back to demo data after a Razorpay/API failure.

## Dashboard Numbers And Charts

| Surface | Value/chart/insight | Previous source | Current real source |
| --- | --- | --- | --- |
| Header | Merchant/source/last synced | Text claimed live pipeline; header had local demo controls | `/api/razorpay/status`, `merchants.last_synced_at`, source label `Razorpay Test Mode` |
| Dashboard KPI | Available Balance | `merchant_config.current_balance` initialized to hardcoded `28500` and demo seed | `merchants.current_balance`, recomputed during Razorpay sync from synced settlements or captured payment net amount |
| Dashboard KPI | Safety Buffer | DB default `15000`; user adjustable | `merchants.safety_buffer`/`merchant_config.safety_buffer`; persisted in SQLite |
| Dashboard KPI | Avg Daily Inflow | UI fallback `18000` | `daily_summaries.total_inflow`, rebuilt from synced Razorpay payments |
| Dashboard KPI | Avg Daily Outflow | UI fallback `12000` and simulated vendor outflow assumptions | Razorpay fees/taxes from synced payments in `daily_summaries.total_outflow` |
| Dashboard KPI | Liquidity Health Score | UI fallback `75` | `riskService.assessRisk()` over computed forecast and stored safety buffer |
| Dashboard Chart | 14-day forecast | EWMA mixed with constants: `28500`, `14500`, `12500`, Thursday vendor assumptions | `forecastService.generateForecast()` over synced Razorpay payments, fees/taxes, day-of-week multipliers, trend, volatility, and settlement delay |
| Dashboard Chart | Forecast range | Not present | Low/base/high balance range from observed volatility |
| Dashboard Table | Recent transactions | SQLite rows, but database was auto-seeded with demo data | Non-demo synced Razorpay payments only (`transactions.is_demo = 0`) |
| Dashboard AI summary | Copilot insight | Gemini or mock template, often over demo-backed numbers | Gemini, if configured, narrates computed context only; otherwise deterministic computed template with no invented numbers |

## Cash Flow Page

| Surface | Value/chart/insight | Previous source | Current real source |
| --- | --- | --- | --- |
| Monthly Avg Daily Inflow | KPI | UI fallback `18000` | `analysisService.calcAverageInflow()` from synced daily summaries |
| Peak Inflow | KPI | UI fallback `35000` | `MAX(total_inflow)` from synced daily summaries |
| Monthly Avg Daily Outflow | KPI | UI fallback `12000` | Fees/taxes from synced Razorpay payments |
| Avg Settlement Turnaround | KPI/pie | Demo-only query and fallback 70/20/10 split | Non-demo synced transaction settlement delay; zero state if no settlements |
| Cash Flow Volatility | KPI | UI fallback `28%` | Coefficient of variation over synced inflows |
| Historical Cash Flow Trajectory | Area chart | Demo-seeded daily summaries | Daily summaries rebuilt from Razorpay sync |
| Day-of-week Inflow Multiplier | Bar chart | Demo summaries and static explanatory copy | Computed from synced daily summaries |

## Transactions Page

| Surface | Value/chart/insight | Previous source | Current real source |
| --- | --- | --- | --- |
| Total Ingested Volume | KPI | Fetched rows, often demo rows | Sum of fetched non-demo Razorpay payments |
| Average Ticket Size | KPI | Fetched rows, often demo rows | Computed from fetched non-demo Razorpay payments |
| Settlement Status | KPI | Hardcoded `99.8% Success` | Computed captured-payment success rate from fetched Razorpay payments |
| Top Payment Mode | KPI | Hardcoded `UPI (58%)` | Computed mode distribution from fetched Razorpay payments |
| Transactions table | Rows | DB seeded demo records | Non-demo synced Razorpay payments |

## Risk And Simulator

| Surface | Value/chart/insight | Previous source | Current real source |
| --- | --- | --- | --- |
| Risk level/breach date/gap | Banner and cards | Forecast constants and engineered Thursday scenario | `assessRisk()` over low/base/high forecast from synced history |
| 3D risk reactor inputs | Visual state | Defaults `HIGH_RISK`, `2963`, `Thursday` | Risk payload values or zero/unknown empty state |
| Working capital simulation | Before/after forecast | Same constant-driven forecast with `20000` default story | Re-runs computed forecast with only the starting balance changed by selected amount |
| Razorpay-native feature | Not truly Razorpay-specific | N/A | Settlement-cycle-aware liquidity gaps from pending captured payments, observed/estimated settlement delay, and forecast range |

## AI-Powered Claims

- `AI Merchant Copilot` is model-computed only when `GEMINI_API_KEY` is configured. Without it, the app returns `source: computed_template`, not `source: mock`.
- LLM output receives a structured context containing only computed Razorpay-derived numbers and is instructed not to invent values.
- The old fallback text invented a Thursday vendor story, INR 20,000 recommendation, and default balances. Those live-path fallbacks were removed from the active services/header and replaced with empty/insufficient-data states.

## Mock Or Demo Code Remaining

- `backend/data/demoData.js`, `backend/data/seeder.js`, and the old webhook simulator route/component remain in the repository as legacy/demo utilities, but the server no longer auto-seeds them and the primary header no longer calls them.
- Live API reads filter `transactions.is_demo = 0` and `settlements.is_demo = 0`.
