CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  payment_id TEXT UNIQUE,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL,
  method TEXT,
  description TEXT,
  created_at TEXT NOT NULL,
  settled_at TEXT,
  settlement_id TEXT,
  is_demo INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settlements (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  fees REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  net_amount REAL NOT NULL,
  settled_at TEXT NOT NULL,
  utr TEXT,
  is_demo INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS merchant_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  merchant_name TEXT DEFAULT 'Demo Merchant',
  safety_buffer REAL DEFAULT 15000,
  current_balance REAL DEFAULT 0,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS daily_summaries (
  date TEXT PRIMARY KEY,
  total_inflow REAL DEFAULT 0,
  total_outflow REAL DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  net_cash_flow REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS forecast_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  generated_at TEXT NOT NULL,
  forecast_data TEXT NOT NULL,
  risk_data TEXT NOT NULL
);
