import 'dotenv/config';
import fs from 'fs/promises';
import crypto from 'crypto';
import connectDB from '../config/db.js';
import Product from '../backend/models/productModel.js';
import Schedule from '../backend/models/scheduleModel.js';
import Operator from '../backend/models/operatorModel.js';
import User from '../backend/models/userModel.js';

const slugify = (input) =>
  String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const isValidImageUrl = (value) => {
  try {
    const parsed = new URL(String(value || ''));
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

const buildSeoFields = (payload) => {
  const baseTitle = payload.metaTitle || payload.title;
  const baseDescription = payload.metaDescription || payload.description || '';
  const ogImage = payload.ogImage || payload.imageUrl || '';
  return {
    metaTitle: String(baseTitle || '').slice(0, 70),
    metaDescription: String(baseDescription || '').slice(0, 160),
    ogTitle: String(payload.ogTitle || baseTitle || '').slice(0, 70),
    ogDescription: String(payload.ogDescription || baseDescription || '').slice(0, 200),
    ogImage: ogImage || '',
  };
};

const buildDefaultSchedules = ({ productId, price, startDate = new Date() }) => {
  const rows = [];
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 3);
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= endDate) {
    rows.push({
      product: productId,
      date: new Date(cursor),
      time: '10:00',
      endTime: '13:00',
      capacity: 20,
      price,
      currency: 'EUR',
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return rows;
};

const getOrCreatePlaceholderOperator = async ({ operatorName = 'Placeholder Partner', operatorEmail }) => {
  const email = operatorEmail || `placeholder_${slugify(operatorName)}_${Date.now()}@overglow.local`;
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: operatorName,
      email,
      password: crypto.randomBytes(16).toString('hex'),
      role: 'Opérateur',
      isApproved: true,
      approvedAt: new Date(),
    });
  }

  let operator = await Operator.findOne({ user: user._id });
  if (!operator) {
    operator = await Operator.create({
      user: user._id,
      companyName: operatorName,
      description: 'Placeholder operator auto-created by mass importer',
      status: 'Active',
      isFormCompleted: false,
      isClaimed: false,
    });
  }

  return operator;
};

const normalizeGps = (gps) => {
  if (Array.isArray(gps) && gps.length === 2) {
    return [Number(gps[0]), Number(gps[1])];
  }
  if (gps && typeof gps === 'object') {
    return [Number(gps.lng), Number(gps.lat)];
  }
  return [NaN, NaN];
};

const main = async () => {
  const filePath = process.argv[2];
  const dryRun = process.argv.includes('--dry-run');
  if (!filePath) {
    console.error('Usage: node -r dotenv/config scripts/massImporter.js <path-to-json> [--dry-run]');
    process.exit(1);
  }

  if (!dryRun) {
    await connectDB();
  }
  const raw = await fs.readFile(filePath, 'utf-8');
  const records = JSON.parse(raw);
  if (!Array.isArray(records)) {
    throw new Error('Input JSON must be an array');
  }

  let created = 0;
  let updated = 0;
  for (const entry of records) {
    const title = entry.title || entry.titre;
    const description = entry.description;
    const price = Number(entry.price || entry.prix);
    const city = entry.city || entry.ville;
    const imageUrl = entry.imageUrl || entry.image || entry.image_url;
    const gps = entry.gps || entry.coordinates;
    const [lng, lat] = normalizeGps(gps);

    if (!title || !description || !Number.isFinite(price) || price <= 0 || !city || !imageUrl || !Number.isFinite(lng) || !Number.isFinite(lat) || !isValidImageUrl(imageUrl)) {
      console.warn('Skipping invalid entry:', { title, city });
      continue;
    }

    const slug = entry.slug || `${slugify(title)}-${Date.now()}`;
    const normalizedStatus = String(entry.status || 'Published').toLowerCase() === 'active' ? 'Published' : (entry.status || 'Published');
    const seo = buildSeoFields({
      title,
      description,
      imageUrl,
      metaTitle: entry.metaTitle,
      metaDescription: entry.metaDescription,
      ogTitle: entry.ogTitle,
      ogDescription: entry.ogDescription,
      ogImage: entry.ogImage,
    });

    if (dryRun) {
      console.log(`[DRY-RUN] Would upsert product slug="${slug}" title="${title}" city="${city}"`);
      continue;
    }

    const operator = await getOrCreatePlaceholderOperator({
      operatorName: entry.operatorName || entry.operator || 'Placeholder Partner',
      operatorEmail: entry.operatorEmail,
    });

    const existing = await Product.findOne({ slug });
    if (existing) {
      existing.price = price;
      existing.description = description;
      existing.images = [imageUrl];
      existing.seo = seo;
      await existing.save();
      updated += 1;
      console.log(`Updated: ${existing.title} (slug: ${existing.slug})`);
      continue;
    }

    const product = await Product.create({
      operator: operator._id,
      title,
      slug,
      description,
      category: entry.category || 'Experiences',
      city,
      address: entry.address || city,
      duration: entry.duration || '3 hours',
      price,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      images: [imageUrl],
      status: normalizedStatus,
      seo,
    });

    const schedules = buildDefaultSchedules({ productId: product._id, price });
    await Schedule.insertMany(schedules);
    created += 1;
    console.log(`Imported: ${product.title} (${schedules.length} schedules)`);
  }

  if (dryRun) {
    console.log('Dry-run complete. No database writes performed.');
  } else {
    console.log(`Import complete. Products created: ${created}, updated: ${updated}`);
  }
  process.exit(0);
};

main().catch((error) => {
  console.error('Mass importer failed:', error);
  process.exit(1);
});
