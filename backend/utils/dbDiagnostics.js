/**
 * [TASK-23] MongoDB diagnostics at startup.
 * Critical failures exit(1) outside Vercel; on Vercel we log and continue (serverless).
 */
import mongoose from 'mongoose';
import { logger } from './logger.js';

const REQUIRED_COLLECTIONS = [
  'users',
  'products',
  'bookings',
  'operators',
  'schedules',
  'reviews',
  'faqs',
];

const isVercel = () => process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);

const failCritical = (message) => {
  logger.error(`[dbDiagnostics] CRITICAL: ${message}`);
  if (!isVercel()) {
    process.exit(1);
  }
  return false;
};

/**
 * Run after a successful mongoose.connect.
 * @returns {Promise<{ ok: boolean, details: object }>}
 */
export const runDbDiagnostics = async () => {
  const details = {
    ping: false,
    collections: {},
    missingCollections: [],
    indexes: {},
    stats: null,
    readOk: false,
  };

  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      failCritical('MongoDB not connected — diagnostics aborted');
      return { ok: false, details };
    }

    // a) Ping
    await mongoose.connection.db.admin().command({ ping: 1 });
    details.ping = true;
    logger.info('[dbDiagnostics] MongoDB ping OK');

    // b) Required collections
    const existing = await mongoose.connection.db.listCollections().toArray();
    const names = new Set(existing.map((c) => c.name));
    for (const name of REQUIRED_COLLECTIONS) {
      const present = names.has(name);
      details.collections[name] = present;
      if (!present) details.missingCollections.push(name);
    }
    if (details.missingCollections.length) {
      logger.warn('[dbDiagnostics] Missing collections (may be empty DB / first boot)', {
        missing: details.missingCollections,
      });
    } else {
      logger.info('[dbDiagnostics] Required collections present');
    }

    // c) Indexes (sample key collections)
    for (const name of ['users', 'products', 'bookings']) {
      if (!names.has(name)) continue;
      try {
        const idxs = await mongoose.connection.db.collection(name).indexes();
        details.indexes[name] = idxs.map((i) => i.name);
        logger.info(`[dbDiagnostics] indexes.${name}`, { indexes: details.indexes[name] });
      } catch (err) {
        logger.warn(`[dbDiagnostics] could not list indexes for ${name}`, { message: err?.message });
      }
    }

    // d) Size + counts (non-fatal if stats unavailable)
    try {
      const stats = await mongoose.connection.db.stats();
      details.stats = {
        db: mongoose.connection.name,
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
      };
      const counts = {};
      for (const name of REQUIRED_COLLECTIONS) {
        if (!names.has(name)) {
          counts[name] = 0;
          continue;
        }
        counts[name] = await mongoose.connection.db.collection(name).countDocuments();
      }
      details.stats.counts = counts;
      logger.info('[dbDiagnostics] DB stats', details.stats);
    } catch (err) {
      logger.warn('[dbDiagnostics] stats unavailable', { message: err?.message });
    }

    // e) Simple read
    await mongoose.connection.db.collection('users').findOne({}, { projection: { _id: 1 } });
    details.readOk = true;
    logger.info('[dbDiagnostics] Simple read OK');

    // Critical: ping must succeed (already). Missing collections warn only on first boot.
    const ok = details.ping && details.readOk;
    if (!ok) failCritical('Ping or read check failed');
    else logger.info('[dbDiagnostics] All critical checks passed');

    return { ok, details };
  } catch (err) {
    failCritical(err?.message || String(err));
    return { ok: false, details };
  }
};

export default { runDbDiagnostics };
