/**
 * Seed / refresh product.i18n for all published products using catalog lexicon.
 * Usage: npm run seed-product-i18n
 * Optional: FORCE=1 to overwrite existing i18n
 */
import 'dotenv/config';
import connectDB from '../config/db.js';
import Product from '../backend/models/productModel.js';
import { buildProductI18n } from '../backend/utils/catalogLexicon.js';

const force = process.env.FORCE === '1' || process.argv.includes('--force');

const run = async () => {
  await connectDB();
  const query = { status: { $regex: /^published$/i } };
  const products = await Product.find(query).select('title description highlights included i18n');
  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const hasEn = product.i18n && typeof product.i18n === 'object' && product.i18n.en?.title;
    if (hasEn && !force) {
      skipped += 1;
      continue;
    }
    product.i18n = buildProductI18n(product);
    await product.save();
    updated += 1;
  }

  console.log(`Product i18n seed done. updated=${updated} skipped=${skipped} force=${force}`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
