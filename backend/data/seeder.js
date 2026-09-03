/**
 * Data seeder — loads demo data into the SQLite database
 * Run once, or when DEMO_MODE=true and DB is empty
 */

const { getDb } = require('../db/init');
const { generateDemoData } = require('./demoData');

function seedDemoData(force = false) {
  const db = getDb();

  // Check if already seeded
  const count = db.prepare('SELECT COUNT(*) as c FROM transactions').get();
  if (count.c > 0 && !force) {
    console.log(`ℹ️  Database already has ${count.c} transactions. Skipping seed. Use force=true to re-seed.`);
    return false;
  }

  console.log('🌱 Seeding demo data...');
  const data = generateDemoData();

  // Clear existing data
  db.exec('BEGIN TRANSACTION;');
  db.exec('DELETE FROM transactions; DELETE FROM settlements; DELETE FROM daily_summaries;');

  // Insert transactions
  const insertTx = db.prepare(`
    INSERT OR REPLACE INTO transactions 
    (id, order_id, payment_id, amount, currency, status, method, description, created_at, settled_at, settlement_id, is_demo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const tx of data.transactions) {
    insertTx.run(
      tx.id, tx.order_id, tx.payment_id, tx.amount, tx.currency,
      tx.status, tx.method, tx.description, tx.created_at,
      tx.settled_at, tx.settlement_id, tx.is_demo
    );
  }

  // Insert settlements
  const insertSetl = db.prepare(`
    INSERT OR REPLACE INTO settlements 
    (id, amount, fees, tax, net_amount, settled_at, utr, is_demo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const s of data.settlements) {
    insertSetl.run(s.id, s.amount, s.fees, s.tax, s.net_amount, s.settled_at, s.utr, s.is_demo);
  }

  // Insert daily summaries
  const insertSummary = db.prepare(`
    INSERT OR REPLACE INTO daily_summaries 
    (date, total_inflow, total_outflow, transaction_count, net_cash_flow)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const s of data.dailySummaries) {
    insertSummary.run(s.date, s.total_inflow, s.total_outflow, s.transaction_count, s.net_cash_flow);
  }

  // Update merchant config with calculated balance
  db.prepare(`
    UPDATE merchant_config 
    SET current_balance = ?, safety_buffer = ?, updated_at = datetime('now')
    WHERE id = 1
  `).run(data.currentBalance, data.safetyBuffer);

  db.exec('COMMIT;');

  console.log(`✅ Demo data seeded successfully:`);
  console.log(`   📊 ${data.transactions.length} transactions`);
  console.log(`   💳 ${data.settlements.length} settlements`);
  console.log(`   📅 ${data.dailySummaries.length} daily summaries`);
  console.log(`   💰 Current balance: ₹${data.currentBalance.toLocaleString('en-IN')}`);

  return true;
}

module.exports = { seedDemoData };
