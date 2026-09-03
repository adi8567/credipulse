# CreditPulse

CreditPulse is a real-time payment intelligence dashboard for small merchants. It turns Razorpay payment history into cash-flow forecasts, risk signals, and practical operating insight.

The project includes a React and Vite frontend, an Express API, a SQLite data layer, Razorpay synchronization, webhook handling, and an optional Gemini-powered AI Copilot.

## What it does

- Dashboard with payment, balance, inflow, and outflow metrics
- Transaction history and payment activity
- Cash-flow forecasts with projected balance ranges
- Risk alerts for safety-buffer and liquidity pressure
- AI Copilot for computed financial insights and questions
- Scenario simulator for testing cash-flow decisions
- Razorpay Test Mode synchronization and webhook support
- Demo mode with local seeded data and computed fallbacks

## Tech stack

- Frontend: React 19, Vite, React Router, Tailwind CSS, Recharts, Three.js
- Backend: Node.js 24, Express, SQLite, LowDB utilities
- Payments: Razorpay API and webhooks
- AI: Google Gemini API, with a computed-insight fallback when no key is configured
- Deployment: Vercel serverless API and static frontend hosting

## Quick start

### Prerequisites

- Node.js 24.x or later
- npm
- Git

### Install

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### Configure environment variables

Copy the example file and adjust values as needed:

```bash
copy .env.example .env
```

Demo mode works without payment or AI credentials. For live integrations, configure the Razorpay values and `GEMINI_API_KEY` in `.env`. Never commit `.env`.

### Run locally

Start the backend and frontend in separate terminals:

```bash
npm start --prefix backend
npm run dev --prefix frontend
```

Open http://localhost:5173. The API runs at http://localhost:5000.

For a quick launcher, use:

```bash
node start.js backend
node start.js frontend
node start.js both
```

The `both` option starts the backend and prints the frontend command for the second terminal.

## Useful commands

```bash
# Build the frontend
npm run build

# Run the frontend linter
npm run lint --prefix frontend

# Start the backend with auto-reload
npm run dev --prefix backend

# Start the backend in production mode
npm start --prefix backend

# Create Razorpay Test Mode payment links
npm run seed:razorpay --prefix backend
```

## Environment variables

See [.env.example](.env.example) for the complete list. The most important settings are:

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend port, default `5000` |
| `DEMO_MODE` | Enables demo behavior when set to `true` |
| `DATABASE_PATH` | SQLite database path |
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signing secret |
| `GEMINI_API_KEY` | Optional Gemini API key for AI Copilot |
| `VITE_API_URL` | Frontend API base URL, default `http://localhost:5000` |

## API overview

- `GET /api/health` - service health and current mode
- `GET /api/data/summary` - merchant and payment summary
- `GET /api/analysis` - payment analysis
- `GET /api/forecast` - cash-flow forecast
- `GET /api/risk` - risk assessment
- `POST /api/copilot/*` - AI Copilot operations
- `POST /api/simulator` - scenario simulation
- `POST /api/webhooks/razorpay` - Razorpay webhook receiver
- `/api/razorpay/*` - Razorpay sync and payment operations

## Project structure

```text
creditpulse/
├── api/                  # Vercel serverless entrypoint
├── backend/
│   ├── data/             # Demo data and seed utilities
│   ├── db/               # SQLite initialization and schema
│   ├── routes/            # API route handlers
│   └── services/         # Forecast, risk, AI, payment, and event logic
├── frontend/
│   └── src/
│       ├── components/   # Shared UI and 3D components
│       ├── pages/        # Dashboard application views
│       └── utils/        # Frontend API helpers
├── .env.example          # Safe environment variable template
├── start.js              # Local development launcher
└── vercel.json            # Vercel routing and build configuration
```

## Deployment

CreditPulse is configured for Vercel. Import the repository, set the required environment variables, and deploy. For the complete process, see [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md).

## Documentation

- [Getting started guide](GETTING_STARTED.md)
- [Vercel deployment guide](DEPLOY_VERCEL.md)
- [Demo walkthrough](DEMO_SCRIPT.md)
- [Audit notes](AUDIT.md)
- [Known limitations](LIMITATIONS.md)
- [Fix summary](FIX_SUMMARY.md)

## Security

Keep API keys and webhook secrets in environment variables. The repository ignores `.env`, dependencies, databases, logs, and build output. If a credential is exposed, revoke and rotate it immediately.

## License

This repository does not currently specify an open-source license.
