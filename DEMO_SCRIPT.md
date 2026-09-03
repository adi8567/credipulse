# CreditPulse Demo Script

This script allows you to test CreditPulse live with a **brand new Razorpay Test Mode account**. This proves the integration is 100% real, the database accurately persists data, and the mathematical forecasting engine computes on-the-fly.

## Setup: Connect a Fresh Razorpay Account

1. Go to your [Razorpay Dashboard](https://dashboard.razorpay.com/) and ensure you are in **Test Mode**.
2. Navigate to **Account & Settings > API Keys** and generate a new Test Key.
3. Open the **CreditPulse App** (e.g., the Vercel deployment URL).
4. Since this is a fresh database, you'll see the connection form in the header. (If an account is already connected, disconnect it via the database or API).
5. Paste your `Test Key ID` and `Test Key Secret`, enter a name (e.g., "Judge's Store"), and click **Connect**.
6. The app will securely encrypt your secret in our backend SQLite database and attempt an initial sync.

*Notice: Your dashboard will look relatively empty or flat because your fresh account has no transactions yet.*

## Step 1: Generate Real Synthetic Data
Since you have a new account, we need to generate real transaction data *through* Razorpay to feed the predictive model.

1. In the CreditPulse header, click **Create Test Links**.
2. The backend actively pings the `client.paymentLink.create()` API to create live, real test links on your Razorpay account.
3. The links will appear at the top of the screen. Click on one of them to open Razorpay's hosted checkout.
4. Complete the checkout using Razorpay's test cards or "Success" netbanking options. (Do this 2-3 times to simulate different amounts).

## Step 2: Ingest the Data
1. Back in CreditPulse, click the **Sync Razorpay** button in the header.
2. The backend reaches out to Razorpay to fetch `client.payments.all()` and `client.orders.all()`.
3. The data is parsed, stored persistently in our SQLite database, and the **Last synced** timestamp updates on the screen.

## Step 3: Validate the Engine
1. Observe the **14-Day Cash Flow Forecast** chart. It has dynamically recalculated based on your new transactions.
2. The EWMA (Exponentially Weighted Moving Average) model factored in the exact amounts you just paid, applied the standard T+2 settlement delay rules, and computed a new trajectory.
3. Check the **Recent Transactions** table — your payments are there.

## Step 4: The AI Copilot
1. Navigate to the **AI Copilot** tab (or click the button in the 3D hologram widget).
2. Ask: *"What is my current balance?"* or *"Am I at risk of breaching my buffer this week?"*
3. The AI reads the *real* calculated forecast (not mocked numbers) and explains your specific financial situation in plain English.

## Step 5 (Optional): The Capital Simulator
1. Go to the **Simulator** tab.
2. Select a working capital advance amount.
3. Watch the forecast graph instantly re-render to show how the injection prevents your projected balance from dipping below your safety buffer.
