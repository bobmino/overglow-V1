/**
 * [TASK-6] Rate limiting compatible Vercel (Upstash Redis) + fallback mémoire local.
 * - Auth: 5 req/min
 * - API: 180 req/min (polls unread exclus)
 * - Upload: 10 req/min
 * - Webhooks: exclus (vérifiés par signature)
 */
import rateLimit from 'express-rate-limit';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from '../utils/logger.js';
import { setCORSHeaders } from '../config/cors.js';

const hasUpstash =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

let redis = null;
if (hasUpstash) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (error) {
    logger.warn('[rateLimiter] Failed to init Upstash Redis:', error.message);
    redis = null;
  }
} else {
  logger.warn(
    '[rateLimiter] UPSTASH_REDIS_REST_URL/TOKEN missing — using in-memory fallback (not reliable on Vercel).'
  );
}

const getClientKey = (req) =>
  req.ip ||
  req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
  req.connection?.remoteAddress ||
  'unknown';

const sendRateLimitResponse = (req, res, retryAfterSec) => {
  setCORSHeaders(req, res);
  logger.security?.rateLimitExceeded?.(getClientKey(req), req.path, retryAfterSec);
  return res.status(429).json({
    error: 'Trop de requêtes. Veuillez réessayer plus tard.',
    retryAfter: retryAfterSec,
  });
};

const createUpstashLimiter = ({ prefix, requests, window }) => {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `overglow:${prefix}`,
    analytics: true,
  });
};

const upstashAuth = createUpstashLimiter({ prefix: 'auth', requests: 5, window: '1 m' });
const upstashApi = createUpstashLimiter({ prefix: 'api', requests: 180, window: '1 m' });
const upstashUpload = createUpstashLimiter({ prefix: 'upload', requests: 10, window: '1 m' });
const upstashFaqAdmin = createUpstashLimiter({ prefix: 'faq-admin', requests: 20, window: '1 m' });

const createUpstashMiddleware = (limiter, fallback, label) => {
  if (!limiter) return fallback;

  return async (req, res, next) => {
    try {
      const key = getClientKey(req);
      const result = await limiter.limit(key);

      res.setHeader('X-RateLimit-Limit', String(result.limit));
      res.setHeader('X-RateLimit-Remaining', String(result.remaining));
      res.setHeader('X-RateLimit-Reset', String(result.reset));

      if (!result.success) {
        const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
        res.setHeader('Retry-After', String(retryAfter));
        return sendRateLimitResponse(req, res, retryAfter);
      }

      return next();
    } catch (error) {
      logger.error(`[rateLimiter] ${label} Upstash error — failing open:`, error.message);
      return next();
    }
  };
};

// ─── Fallback mémoire (dev local uniquement) ─────────────────────────────────
const memoryAuthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => sendRateLimitResponse(req, res, 60),
});

const memoryApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const path = req.path || '';
    // Auth a son propre limiter ; health + webhooks + polls légers exclus
    return (
      path.startsWith('/auth') ||
      path.startsWith('/health') ||
      path.includes('/webhook/') ||
      path.includes('/notifications/unread-count') ||
      path.includes('/chat/unread-count')
    );
  },
  handler: (req, res) => sendRateLimitResponse(req, res, 60),
});

const memoryUploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => sendRateLimitResponse(req, res, 60),
});

const memoryFaqAdminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => sendRateLimitResponse(req, res, 60),
});

/** Auth endpoints: 5 req/min */
export const authLimiter = createUpstashMiddleware(upstashAuth, memoryAuthLimiter, 'auth');

/** API globale: 180 req/min — saute auth/health/webhooks/polls unread */
export const apiLimiter = (() => {
  const upstashMw = createUpstashMiddleware(upstashApi, memoryApiLimiter, 'api');
  return (req, res, next) => {
    const path = req.path || '';
    if (
      path.startsWith('/auth') ||
      path.startsWith('/health') ||
      path.includes('/webhook/') ||
      path.includes('/notifications/unread-count') ||
      path.includes('/chat/unread-count')
    ) {
      return next();
    }
    return upstashMw(req, res, next);
  };
})();

/** Upload / paiements sensibles: 10 req/min */
export const strictLimiter = createUpstashMiddleware(
  upstashUpload,
  memoryUploadLimiter,
  'upload'
);

/** [TASK-23] FAQ admin CRUD: 20 req/min */
export const faqAdminLimiter = createUpstashMiddleware(
  upstashFaqAdmin,
  memoryFaqAdminLimiter,
  'faq-admin'
);
