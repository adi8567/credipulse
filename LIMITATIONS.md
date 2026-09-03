# CreditPulse - Limitations & Honest Disclosure

In the spirit of the hackathon, we have prioritized building a real, fully functional integration path from Razorpay all the way to the frontend UI. However, due to time constraints, some features are out-of-scope or partially mocked.

Here is a completely transparent breakdown of what is real and what is limited.

## What is 100% REAL

1. **Razorpay Payments & Orders API:** The connection is real. Fetching transactions is real. The keys are stored securely using Node.js `crypto`.
2. **Razorpay Payment Links:** The "Create Test Links" button makes live API calls to Razorpay to generate real checkout links.
3. **The Forecasting Engine:** The math behind the 14-day projection (in `backend/services/forecastService.js`) is real. It uses Exponentially Weighted Moving Average (EWMA), calculates volatility, applies day-of-week seasonality, and factors in actual settlement delays. It does NOT use hardcoded numbers.
4. **Backend & Database:** We are using an Express server and a real `node:sqlite` database with WAL mode enabled. Data persists across sessions (or across the serverless function execution context).
5. **Dynamic UI:** Every number, chart, and alert in the dashboard is strictly fed by data from the API.
6. **AI Narrative Separation:** The AI is strictly prompted to explain the mathematical model's output. It does not invent the forecast numbers itself.

## What is LIMITED or STUBBED

1. **Razorpay X / Payroll / Route:** We originally planned to pull outbound payout data to get a complete cash-flow picture. However, due to test mode limitations / sandbox access restrictions, this is out of scope. Currently, outflows are estimated within the forecasting engine based on fee and tax deductions from transactions, rather than explicit Razorpay X payout webhooks.
2. **Webhooks:** While the app has webhook endpoints defined, configuring the live Razorpay dashboard to hit our Vercel URL with webhooks was skipped for the demo. Instead, the UI provides a manual "Sync Razorpay" polling button that fetches the latest data via the SDK.
3. **Database on Vercel:** Since Vercel is a serverless environment with a read-only filesystem (except `/tmp`), the SQLite database is stored in `/tmp/creditpulse.db`. This means the database is persistent *during* the lifetime of the lambda execution environment, but will reset if the function goes cold. For a production deployment, this would be swapped out for a hosted Postgres/Supabase instance.
4. **Authentication:** The app currently handles a single merchant context (ID = 1 in the database). A full multi-tenant JWT authentication system was out-of-scope for the 48-hour build.
