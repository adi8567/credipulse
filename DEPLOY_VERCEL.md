# CreditPulse — Vercel Deployment Guide

CreditPulse is fully pre-configured for **1-click deployment on Vercel** as a fullstack application (Vite + React frontend with serverless Node.js Express API backend).

---

## ⚡ Method 1: Deploy via GitHub (Recommended & Easiest)

### Step 1: Push code to a new GitHub repository
Run the following in your terminal inside `C:\Users\ADITYA\.gemini\antigravity\scratch\creditpulse`:

```bash
# Add your remote GitHub repository URL
git remote add origin https://github.com/<your-username>/creditpulse.git
git branch -M main
git push -u origin main
```

### Step 2: Import into Vercel
1. Go to [**https://vercel.com/new**](https://vercel.com/new).
2. Select your newly pushed `creditpulse` repository and click **Import**.
3. Under **Environment Variables**, add:
   - **`GEMINI_API_KEY`**: `<your-gemini-api-key>`
   - **`DEMO_MODE`**: `true`
4. Click **Deploy**.

Vercel will automatically:
- Execute `npm run build` to compile the React/Tailwind/Three.js frontend into `frontend/dist`.
- Route `/api/*` requests to the serverless function in `api/index.js`.
- Provide you with a live HTTPS production URL (e.g., `https://creditpulse.vercel.app`)!

---

## 🚀 Method 2: Deploy directly from CLI via `npx vercel`

If you have a Vercel account:

1. Open your terminal in `C:\Users\ADITYA\.gemini\antigravity\scratch\creditpulse`.
2. Run:
   ```bash
   npx vercel
   ```
3. Follow the interactive prompts:
   - *Set up and deploy?* ➔ `Y`
   - *Which scope?* ➔ Select your personal/team account
   - *Link to existing project?* ➔ `N`
   - *Project name?* ➔ `creditpulse`
   - *In which directory is your code located?* ➔ `./`
4. Once deployed to preview, deploy to production:
   ```bash
   npx vercel --prod
   ```
5. Add your environment variables in the Vercel dashboard:
   - `GEMINI_API_KEY`: `<your-gemini-api-key>`
   - `DEMO_MODE`: `true`

---

## 📁 Architecture on Vercel

```
creditpulse/
├── vercel.json           # Vercel routing & build config
├── api/
│   └── index.js          # Serverless entrypoint wrapping Express app
├── backend/              # Full Express API + Gemini AI + SQLite engine
│   ├── routes/           # /api/forecast, /api/risk, /api/copilot, /api/simulator
│   └── services/         # aiService.js, forecastService.js, analysisService.js
└── frontend/             # Vite + React 18 + Tailwind + Three.js 3D UI
    └── dist/             # Compiled production bundle served globally via CDN
```
