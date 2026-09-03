const Razorpay = require('razorpay');
const { getDb } = require('../db/init');
const { encrypt, decrypt } = require('./cryptoService');

function toRupees(value) {
  return Math.round((Number(value || 0) / 100) * 100) / 100;
}

function toIso(seconds) {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

function getMerchant() {
  return getDb().prepare('SELECT * FROM merchants WHERE id = 1').get();
}

function getClient() {
  const merchant = getMerchant();
  const keyId = merchant?.razorpay_key_id || process.env.RAZORPAY_KEY_ID;
  const encryptedSecret = merchant?.razorpay_key_secret_encrypted;
  const keySecret = encryptedSecret ? decrypt(encryptedSecret) : process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const err = new Error('Razorpay test credentials are not connected.');
    err.code = 'RAZORPAY_NOT_CONNECTED';
    throw err;
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

async function connectCredentials({ key_id, key_secret, merchant_name }) {
  if (!key_id || !key_secret) {
    const err = new Error('Both Razorpay Key ID and Key Secret are required.');
    err.status = 400;
    throw err;
  }

  const client = new Razorpay({ key_id, key_secret });
  await client.orders.all({ count: 1 });

  const db = getDb();

  db.prepare(`
    UPDATE merchants
    SET razorpay_key_id = ?,
        razorpay_key_secret_encrypted = ?,
        merchant_name = ?,
        sync_error = NULL,
        updated_at = datetime('now')
    WHERE id = 1
  `).run(
    key_id,
    encrypt(key_secret),
    merchant_name || 'Razorpay Test Merchant'
  );

  db.prepare(`
    UPDATE merchant_config
    SET merchant_name = ?,
        updated_at = datetime('now')
    WHERE id = 1
  `).run(
    merchant_name || 'Razorpay Test Merchant'
  );

  return getConnectionStatus();
}

function getConnectionStatus() {
  const merchant = getMerchant();
  const tx = getDb().prepare('SELECT COUNT(*) as count FROM transactions WHERE is_demo = 0').get();
  return {
    connected: Boolean(merchant?.razorpay_key_id && merchant?.razorpay_key_secret_encrypted),
    key_id: merchant?.razorpay_key_id || null,
    merchant_name: merchant?.merchant_name || 'Connected Merchant',
    last_synced_at: merchant?.last_synced_at || null,
    sync_error: merchant?.sync_error || null,
    source: 'Razorpay Test Mode',
    live_transaction_count: tx?.count || 0,
  };
}

function upsertPayment(payment) {
  const db = getDb();
  const amount = toRupees(payment.amount);
  const fee = toRupees(payment.fee);
  const tax = toRupees(payment.tax);
  db.prepare(`
    INSERT INTO transactions
    (id, order_id, payment_id, amount, currency, status, method, description, created_at,
     settled_at, settlement_id, fee, tax, source, raw_payload, is_demo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'razorpay_test_mode', ?, 0)
    ON CONFLICT(id) DO UPDATE SET
      order_id = excluded.order_id,
      payment_id = excluded.payment_id,
      amount = excluded.amount,
      currency = excluded.currency,
      status = excluded.status,
      method = excluded.method,
      description = excluded.description,
      created_at = excluded.created_at,
      fee = excluded.fee,
      tax = excluded.tax,
      raw_payload = excluded.raw_payload,
      is_demo = 0
  `).run(
    payment.id,
    payment.order_id || null,
    payment.id,
    amount,
    payment.currency || 'INR',
    payment.status || 'unknown',
    payment.method || null,
    payment.description || payment.notes?.description || 'Razorpay payment',
    toIso(payment.created_at) || new Date().toISOString(),
    null,
    null,
    fee,
    tax,
    JSON.stringify(payment)
  );
}

function upsertOrder(order) {
  getDb().prepare(`
    INSERT INTO orders (id, amount, currency, receipt, status, attempts, created_at, raw_payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      amount = excluded.amount,
      currency = excluded.currency,
      receipt = excluded.receipt,
      status = excluded.status,
      attempts = excluded.attempts,
      raw_payload = excluded.raw_payload
  `).run(
    order.id,
    toRupees(order.amount),
    order.currency || 'INR',
    order.receipt || null,
    order.status || null,
    order.attempts || 0,
    toIso(order.created_at) || new Date().toISOString(),
    JSON.stringify(order)
  );
}

function upsertSettlement(settlement) {
  getDb().prepare(`
    INSERT INTO settlements (id, amount, fees, tax, net_amount, settled_at, utr, raw_payload, is_demo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    ON CONFLICT(id) DO UPDATE SET
      amount = excluded.amount,
      fees = excluded.fees,
      tax = excluded.tax,
      net_amount = excluded.net_amount,
      settled_at = excluded.settled_at,
      utr = excluded.utr,
      raw_payload = excluded.raw_payload,
      is_demo = 0
  `).run(
    settlement.id,
    toRupees(settlement.amount),
    toRupees(settlement.fees),
    toRupees(settlement.tax),
    toRupees((settlement.amount || 0) - (settlement.fees || 0) - (settlement.tax || 0)),
    toIso(settlement.created_at) || new Date().toISOString(),
    settlement.utr || null,
    JSON.stringify(settlement)
  );
}

function rebuildDailySummaries() {
  const db = getDb();
  db.exec('DELETE FROM daily_summaries;');
  db.prepare(`
    INSERT INTO daily_summaries (date, total_inflow, total_outflow, transaction_count, net_cash_flow)
    SELECT
      substr(created_at, 1, 10) as date,
      SUM(CASE WHEN status IN ('captured', 'authorized', 'refunded', 'failed') THEN amount ELSE 0 END) as total_inflow,
      SUM(COALESCE(fee, 0) + COALESCE(tax, 0)) as total_outflow,
      COUNT(*) as transaction_count,
      SUM(CASE WHEN status = 'captured' THEN amount - COALESCE(fee, 0) - COALESCE(tax, 0) ELSE 0 END) as net_cash_flow
    FROM transactions
    WHERE is_demo = 0
    GROUP BY substr(created_at, 1, 10)
  `).run();
}

function updateBalanceFromSyncedData() {
  const db = getDb();
  const settled = db.prepare('SELECT COALESCE(SUM(net_amount), 0) as total FROM settlements WHERE is_demo = 0').get();
  const captured = db.prepare(`
    SELECT COALESCE(SUM(amount - COALESCE(fee, 0) - COALESCE(tax, 0)), 0) as total
    FROM transactions
    WHERE is_demo = 0 AND status = 'captured'
  `).get();
  const currentBalance = settled.total > 0 ? settled.total : captured.total;
  db.prepare(`
    UPDATE merchants
    SET current_balance = ?, last_synced_at = ?, sync_error = NULL, updated_at = datetime('now')
    WHERE id = 1
  `).run(currentBalance, new Date().toISOString());
  db.prepare(`
    UPDATE merchant_config
    SET current_balance = ?, last_synced_at = ?, sync_error = NULL, updated_at = datetime('now')
    WHERE id = 1
  `).run(currentBalance, new Date().toISOString());
}

async function syncRazorpayData() {
  const client = getClient();
  const db = getDb();

  try {
    const since = Math.floor(
      (Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000
    );

    const [payments, orders, settlements] = await Promise.all([
      client.payments.all({
        from: since,
        count: 100,
      }),

      client.orders.all({
        from: since,
        count: 100,
      }),

      client.settlements.all({
        from: since,
        count: 100,
      }).catch((err) => {
        // Re-throw authentication/permission errors
        if (err?.statusCode === 401 || err?.statusCode === 403) {
          throw err;
        }

        // If settlements are unavailable, continue syncing
        // payments and orders.
        return { items: [] };
      }),
    ]);

    db.exec('BEGIN TRANSACTION;');

    // Store Razorpay payments
    for (const payment of payments.items || []) {
      upsertPayment(payment);
    }

    // Store Razorpay orders
    for (const order of orders.items || []) {
      upsertOrder(order);
    }

    // Store Razorpay settlements
    for (const settlement of settlements.items || []) {
      upsertSettlement(settlement);
    }

    // Rebuild daily cash-flow summaries
    rebuildDailySummaries();

    // Update merchant balance and sync timestamp
    updateBalanceFromSyncedData();

    db.exec('COMMIT;');

    return {
      source: 'Razorpay Test Mode',
      synced_at: new Date().toISOString(),
      payments: payments.items?.length || 0,
      orders: orders.items?.length || 0,
      settlements: settlements.items?.length || 0,
    };

  } catch (err) {
    // Roll back any database changes if sync failed
    try {
      db.exec('ROLLBACK;');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }

    // Store the actual Razorpay/API error.
    // IMPORTANT: use single quotes around 'now'.
    try {
      db.prepare(
        "UPDATE merchants SET sync_error = ?, updated_at = datetime('now') WHERE id = 1"
      ).run(err.message);

      db.prepare(
        "UPDATE merchant_config SET sync_error = ?, updated_at = datetime('now') WHERE id = 1"
      ).run(err.message);
    } catch (dbError) {
      console.error('Failed to save sync error:', dbError);
    }

    // Return the appropriate HTTP status
    err.status = err.code === 'RAZORPAY_NOT_CONNECTED' ? 400 : 502;

    throw err;
  }
}

async function createTestPaymentLinks(count = 5) {
  const client = getClient();
  const amounts = [49900, 79900, 129900, 249900, 399900, 549900].slice(0, Math.max(1, Math.min(count, 6)));
  const created = [];

  for (let i = 0; i < amounts.length; i++) {
    const paymentLink = await client.paymentLink.create({
      amount: amounts[i],
      currency: 'INR',
      description: `CreditPulse test order ${i + 1}`,
      customer: {
        name: `CreditPulse Test Buyer ${i + 1}`,
        email: `buyer${i + 1}@example.com`,
        contact: `90000900${String(i + 1).padStart(2, '0')}`,
      },
      notify: { sms: false, email: false },
      reminder_enable: false,
      notes: { source: 'creditpulse_seed_script' },
    });

    getDb().prepare(`
      INSERT INTO payment_links (id, short_url, amount, currency, description, status, created_at, raw_payload)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET short_url = excluded.short_url, status = excluded.status, raw_payload = excluded.raw_payload
    `).run(
      paymentLink.id,
      paymentLink.short_url,
      toRupees(paymentLink.amount),
      paymentLink.currency || 'INR',
      paymentLink.description || `CreditPulse test order ${i + 1}`,
      paymentLink.status || 'created',
      toIso(paymentLink.created_at) || new Date().toISOString(),
      JSON.stringify(paymentLink)
    );

    created.push({
      id: paymentLink.id,
      amount: toRupees(paymentLink.amount),
      status: paymentLink.status,
      short_url: paymentLink.short_url,
    });
  }

  return created;
}

module.exports = {
  connectCredentials,
  getConnectionStatus,
  syncRazorpayData,
  createTestPaymentLinks,
};
