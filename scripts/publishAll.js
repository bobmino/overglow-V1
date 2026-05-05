import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Product from '../backend/models/productModel.js';

const main = async () => {
  await connectDB();

  const result = await Product.updateMany(
    {},
    { $set: { status: 'Published' } }
  );

  console.log('[Operation Lumiere] Products published:', result.modifiedCount ?? 0);
  console.log('[Operation Lumiere] Connected to database:', mongoose.connection.name);
  process.exit(0);
};

main().catch((error) => {
  console.error('[Operation Lumiere] Failed:', error);
  process.exit(1);
});
