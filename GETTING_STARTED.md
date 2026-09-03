# 🚀 CreditPulse - Getting Started Guide

## Prerequisites

- **Node.js** 24.x or higher
- **npm** (comes with Node.js)
- **Git** (for version control)

## Quick Start (Local Development)

### 1. Install Dependencies

All dependencies are already installed during project setup:

```bash
# Backend dependencies (if needed)
cd backend && npm install

# Frontend dependencies (if needed)  
cd frontend && npm install
```

### 2. Environment Configuration

The `.env` file has been created with default configuration. For production, update these values:

- **`RAZORPAY_KEY_ID`**: Your Razorpay API Key ID
- **`RAZORPAY_KEY_SECRET`**: Your Razorpay API Secret
- **`RAZORPAY_WEBHOOK_SECRET`**: Your Razorpay Webhook Secret
- **`OPENAI_API_KEY`**: For AI Copilot features (optional)
- **`DEMO_MODE`**: Set to `false` for production

See [`.env.example`](.env.example) for all available configuration options.

### 3. Start the Application

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend Development Server:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

Visit **http://localhost:5173** in your browser.

## Project Structure

```
creditpulse/
├── backend/                 # Express.js API server
│   ├── db/                 # SQLite database & schema
│   ├── routes/             # API endpoint handlers
│   ├── services/           # Business logic
│   ├── data/               # Demo data generators
│   └── scripts/            # Utility scripts
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── hooks/         # Custom React hooks
│   └── public/            # Static assets
├── api/                    # Vercel serverless function
└── .env                   # Environment variables (gitignored)
```

## Available Scripts

### Backend
```bash
npm run dev         # Start with nodemon (auto-reload)
npm start          # Start production server
npm run seed:razorpay  # Create test payment links
```

### Frontend
```bash
npm run dev        # Start development server on :5173
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run linter
```

## Database

- **Type**: SQLite
- **Location**: `backend/db/creditpulse.db`
- **Auto-initialized**: On first server startup
- **Schema**: Located in `backend/db/schema.sql`

### Demo Data

The application includes demo data that auto-loads in `DEMO_MODE=true`:

```bash
cd backend
npm run seed:razorpay
```

## API Endpoints

### Core APIs
- `GET /api/health` - Health check
- `GET /api/data/summary` - Financial summary
- `GET /api/analysis` - Payment analysis
- `GET /api/forecast` - Cash flow forecasts
- `GET /api/risk` - Risk assessment
- `POST /api/simulator` - Scenario simulator
- `POST /api/webhooks/razorpay` - Razorpay webhooks

### Documentation
See [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) for detailed API usage examples.

## Features

✅ **Real-time Dashboard** - Payment metrics and analytics  
✅ **Razorpay Integration** - Direct payment processing  
✅ **AI Copilot** - Intelligent financial insights  
✅ **Risk Assessment** - Automated risk scoring  
✅ **Cash Flow Forecasts** - Predictive analytics  
✅ **Payment Simulator** - Scenario testing  
✅ **Webhook Support** - Real-time payment updates  

## Troubleshooting

### Database Issues
```bash
# Reset database
rm backend/db/creditpulse.db*
# Restart backend - will auto-initialize
```

### Port Already in Use
```bash
# Change ports in .env
PORT=5001  # Backend
# Vite auto-detects alternative ports
```

### Dependencies Not Found
```bash
# Clear node_modules and reinstall
rm -r backend/node_modules frontend/node_modules
npm install --prefix backend
npm install --prefix frontend
```

## Production Deployment

### Vercel (Recommended)
See [`DEPLOY_VERCEL.md`](DEPLOY_VERCEL.md) for detailed Vercel deployment instructions.

### Self-Hosted
```bash
# Build frontend
cd frontend && npm run build

# Start backend (production)
cd backend
NODE_ENV=production npm start
```

## Limitations & Known Issues

See [`LIMITATIONS.md`](LIMITATIONS.md) for current limitations and workarounds.

## Support & Documentation

- **Audit Notes**: See [`AUDIT.md`](AUDIT.md)
- **Demo Walkthrough**: See [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md)
- **Deployment Guide**: See [`DEPLOY_VERCEL.md`](DEPLOY_VERCEL.md)

---

**CreditPulse** - Real-time Payment Intelligence Platform  
Built for the **Razorpay Buildathon** 🚀
