/**
 * In-memory FX rate cache with 1-hour TTL.
 * [TASK-19] Pair key = `${from}_${to}` → { rate, timestamp }
 */
import { logger } from './logger.js';

const TTL_MS = 60 * 60 * 1000; // 1 hour

/** @type {Map<string, { rate: number, timestamp: number }>} */
const cache = new Map();

/** Fallback rates to MAD (aligned with payment convert-to-mad defaults). */
export const FALLBACK_RATES_TO_MAD = {
  EUR: 10.8,
  USD: 10.0,
  GBP: 13.5,
  MAD: 1.0,
};

const pairKey = (from, to) => `${String(from).toUpperCase()}_${String(to).toUpperCase()}`;

export const getCachedRate = (from, to) => {
  const key = pairKey(from, to);
  const hit = cache.get(key);
  if (!hit) {
    logger.debug('FX cache miss', { pair: key });
    return null;
  }
  if (Date.now() - hit.timestamp > TTL_MS) {
    cache.delete(key);
    logger.debug('FX cache expired', { pair: key });
    return null;
  }
  logger.debug('FX cache hit', { pair: key, rate: hit.rate });
  return hit.rate;
};

export const setCachedRate = (from, to, rate) => {
  const key = pairKey(from, to);
  cache.set(key, { rate: Number(rate), timestamp: Date.now() });
  logger.debug('FX cache set', { pair: key, rate });
};

/**
 * Resolve rate to MAD: cache → optional fetcher → fallback.
 * @param {string} from
 * @param {() => Promise<number|null>} [fetchRate]
 */
export const getRateToMAD = async (from, fetchRate) => {
  const src = String(from || 'EUR').toUpperCase();
  if (src === 'MAD') return 1;

  const cached = getCachedRate(src, 'MAD');
  if (cached != null) return cached;

  if (typeof fetchRate === 'function') {
    try {
      const live = await fetchRate(src);
      if (live != null && Number.isFinite(Number(live))) {
        setCachedRate(src, 'MAD', Number(live));
        return Number(live);
      }
    } catch (err) {
      logger.warn('FX live fetch failed — using fallback', { from: src, message: err?.message });
    }
  }

  const fallback = FALLBACK_RATES_TO_MAD[src] ?? 1;
  logger.info('FX using fallback rate', { from: src, rate: fallback });
  setCachedRate(src, 'MAD', fallback);
  return fallback;
};

export const clearFxCache = () => cache.clear();

export default {
  getCachedRate,
  setCachedRate,
  getRateToMAD,
  FALLBACK_RATES_TO_MAD,
  clearFxCache,
};
