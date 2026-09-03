require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { initDb, getDb } = require('../db/init');
const { encrypt } = require('../services/cryptoService');
const { createTestPaymentLinks } = require('../services/razorpayService');

async function main() {
  initDb();

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (keyId && keySecret) {
    getDb().prepare(`
      UPDATE merchants
      SET razorpay_key_id = ?, razorpay_key_secret_encrypted = ?, merchant_name = ?,
          sync_error = NULL, updated_at = datetime('now')
      WHERE id = 1
    `).run(keyId, encrypt(keySecret), process.env.MERCHANT_NAME || 'Razorpay Test Merchant');
  }

  const links = await createTestPaymentLinks(Number(process.env.SEED_LINK_COUNT || 5));
  console.log('Created Razorpay Test Mode payment links:');
  for (const link of links) {
    console.log(`- INR ${link.amount}: ${link.short_url}`);
  }
  console.log('Pay these links with Razorpay test payment methods, then run Sync Razorpay in the app.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
