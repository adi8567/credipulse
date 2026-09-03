const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

function getDatabasePath() {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    // In Vercel serverless environment, /tmp is writable
    const tmpPath = path.join('/tmp', 'creditpulse.db');
    return tmpPath;
  }
  return path.join(__dirname, 'creditpulse.db');
}

let db;

function getDb() {
  if (!db) {
    const dbPath = getDatabasePath();
    try {
      db = new DatabaseSync(dbPath);
    } catch (e) {
      console.warn('Could not open file-based DB, falling back to in-memory SQLite:', e.message);
      db = new DatabaseSync(':memory:');
    }
  }
  return db;
}

function initDb() {
  const database = getDb();

  // Enable WAL mode for better performance (if file-based)
  try {
    database.exec('PRAGMA journal_mode = WAL;');
    database.exec('PRAGMA foreign_keys = ON;');
  } catch (e) {
    // In-memory pragmas might behave slightly differently
  }

  // Create tables
  database.exec(`
    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY DEFAULT 1,
      razorpay_key_id TEXT,
      razorpay_key_secret_encrypted TEXT,
      merchant_name TEXT DEFAULT 'Connected Merchant',
      safety_buffer REAL DEFAULT 15000,
      current_balance REAL DEFAULT 0,
      last_synced_at TEXT,
      sync_error TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT
    );

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
      fee REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      source TEXT DEFAULT 'razorpay_test_mode',
      raw_payload TEXT,
      is_demo INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      receipt TEXT,
      status TEXT,
      attempts INTEGER DEFAULT 0,
      created_at TEXT,
      raw_payload TEXT
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      fees REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      net_amount REAL NOT NULL,
      settled_at TEXT NOT NULL,
      utr TEXT,
      raw_payload TEXT,
      is_demo INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS merchant_config (
      id INTEGER PRIMARY KEY DEFAULT 1,
      merchant_name TEXT DEFAULT 'Connected Merchant',
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

    CREATE TABLE IF NOT EXISTS payment_links (
      id TEXT PRIMARY KEY,
      short_url TEXT,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      description TEXT,
      status TEXT,
      created_at TEXT,
      raw_payload TEXT
    );
  `);

  for (const stmt of [
    "ALTER TABLE transactions ADD COLUMN fee REAL DEFAULT 0",
    "ALTER TABLE transactions ADD COLUMN tax REAL DEFAULT 0",
    "ALTER TABLE transactions ADD COLUMN source TEXT DEFAULT 'razorpay_test_mode'",
    "ALTER TABLE transactions ADD COLUMN raw_payload TEXT",
    "ALTER TABLE settlements ADD COLUMN raw_payload TEXT",
    "ALTER TABLE merchant_config ADD COLUMN last_synced_at TEXT",
    "ALTER TABLE merchant_config ADD COLUMN sync_error TEXT"
  ]) {
    try { database.exec(stmt); } catch (e) { /* column already exists */ }
  }

  // Ensure merchant config row exists
  const existing = database.prepare('SELECT id FROM merchant_config WHERE id = 1').get();
  if (!existing) {
    database.prepare(`
      INSERT INTO merchant_config (id, merchant_name, safety_buffer, current_balance, updated_at)
      VALUES (1, 'Connected Merchant', 15000, 0, datetime('now'))
    `).run();
  }

  const merchant = database.prepare('SELECT id FROM merchants WHERE id = 1').get();
  if (!merchant) {
    database.prepare(`
      INSERT INTO merchants (id, merchant_name, safety_buffer, current_balance, updated_at)
      VALUES (1, 'Connected Merchant', 15000, 0, datetime('now'))
    `).run();
  }

  return database;
}

module.exports = { getDb, initDb };
