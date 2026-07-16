/**
 * Seed production CMS content: blog SEO + FAQ (MongoDB).
 * Usage: npm run seed:cms
 * Requires MONGO_URI in .env (root).
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import Blog from '../backend/models/blogModel.js';
import FAQ from '../backend/models/faqModel.js';
import User from '../backend/models/userModel.js';
import { SEO_BLOG_SEED } from '../backend/data/seoBlogSeed.js';
import { FAQ_SEED } from '../backend/data/faqSeed.js';

const connect = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI missing in .env');
  }
  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB_NAME || undefined,
  });
};

const resolveAuthorId = async () => {
  let admin = await User.findOne({ role: 'Admin' }).select('_id');
  if (!admin) {
    admin = await User.findOne({ role: { $in: ['Admin', 'admin'] } }).select('_id');
  }
  if (!admin) {
    // Fallback: any user (blog requires author)
    admin = await User.findOne({}).select('_id');
  }
  if (!admin) {
    throw new Error('No user found to assign as blog author. Create an admin first (npm run create-admin).');
  }
  return admin._id;
};

const seedBlog = async (authorId) => {
  let created = 0;
  let skipped = 0;
  for (const postData of SEO_BLOG_SEED) {
    const existing = await Blog.findOne({ slug: postData.slug });
    if (existing) {
      skipped += 1;
      continue;
    }
    await Blog.create({
      ...postData,
      author: authorId,
      publishedAt: new Date(),
    });
    created += 1;
  }
  return { created, skipped, total: await Blog.countDocuments({}) };
};

const seedFaq = async (authorId) => {
  let created = 0;
  let skipped = 0;
  for (const item of FAQ_SEED) {
    const existing = await FAQ.findOne({
      question: item.question,
      language: item.language,
    });
    if (existing) {
      skipped += 1;
      continue;
    }
    await FAQ.create({
      ...item,
      isActive: true,
      createdBy: authorId,
      updatedBy: authorId,
    });
    created += 1;
  }
  return { created, skipped, total: await FAQ.countDocuments({}) };
};

/** Drop legacy text indexes that use default language_override:"language" (breaks ar/es). */
const fixTextIndexes = async () => {
  for (const Model of [Blog, FAQ]) {
    const coll = Model.collection;
    let indexes = [];
    try {
      indexes = await coll.indexes();
    } catch (_) {
      continue;
    }
    for (const idx of indexes) {
      if (!idx.key || !Object.values(idx.key).includes('text')) continue;
      const override = idx.language_override || 'language';
      if (override === 'language' || idx.default_language === 'english') {
        console.log(`Dropping conflicting text index on ${coll.collectionName}: ${idx.name}`);
        await coll.dropIndex(idx.name);
      }
    }
  }
  // Recreate from schema definitions
  await Blog.syncIndexes();
  await FAQ.syncIndexes();
  console.log('Text indexes synced');
};

const main = async () => {
  await connect();
  console.log('Connected to MongoDB');
  await fixTextIndexes();
  const authorId = await resolveAuthorId();
  const blog = await seedBlog(authorId);
  const faq = await seedFaq(authorId);
  console.log('Blog seed:', blog);
  console.log('FAQ seed:', faq);
  console.log(
    'By language — Blog:',
    await Blog.aggregate([{ $group: { _id: '$language', n: { $sum: 1 } } }])
  );
  console.log(
    'By language — FAQ:',
    await FAQ.aggregate([{ $group: { _id: '$language', n: { $sum: 1 } } }])
  );
  await mongoose.disconnect();
  console.log('Done.');
};

main().catch(async (err) => {
  console.error(err.message || err);
  try {
    await mongoose.disconnect();
  } catch (_) {
    /* ignore */
  }
  process.exit(1);
});
