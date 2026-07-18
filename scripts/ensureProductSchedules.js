/**
 * Crée des créneaux (90 jours) pour les produits Published sans schedule.
 * Usage: node -r dotenv/config scripts/ensureProductSchedules.js
 * Docker: docker compose exec api node -r dotenv/config scripts/ensureProductSchedules.js
 */
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Product from '../backend/models/productModel.js';
import Schedule from '../backend/models/scheduleModel.js';

dotenv.config();

const buildSchedules = ({ productId, price, days = 90 }) => {
  const entries = [];
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i += 1) {
    const date = new Date(current);
    date.setDate(current.getDate() + i);
    entries.push({
      product: productId,
      date,
      time: '10:00',
      endTime: '13:00',
      capacity: 20,
      price,
      currency: 'MAD',
    });
  }
  return entries;
};

const run = async () => {
  await connectDB();
  const products = await Product.find({ status: 'Published' }).select('_id title price slug');
  let filled = 0;
  let skipped = 0;

  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (const product of products) {
    const futureCount = await Schedule.countDocuments({
      product: product._id,
      date: { $gte: tomorrow },
    });
    if (futureCount >= 30) {
      skipped += 1;
      continue;
    }
    // Horizon trop court ou vide → purge + régénère 90 jours
    await Schedule.deleteMany({ product: product._id });
    const entries = buildSchedules({ productId: product._id, price: product.price || 0 });
    await Schedule.insertMany(entries);
    filled += 1;
    console.log(`schedules+${entries.length} → ${product.slug || product.title}`);
  }

  console.log(JSON.stringify({ products: products.length, filled, skipped }, null, 2));
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
