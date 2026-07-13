import { logger } from '../utils/logger.js';
/**
 * CORS centralisé — allowlist explicite (pas de wildcard *.vercel.app).
 * [TASK-1] Source unique pour server.js, api/index.js, middlewares et controllers.
 */

export const CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

export const CORS_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
  'X-API-Key',
  'stripe-signature',
  'paypal-transmission-id',
  'paypal-transmission-time',
  'paypal-cert-url',
  'paypal-auth-algo',
  'paypal-transmission-sig',
];

/** Domaines autorisés par défaut (production + local). */
export const DEFAULT_ALLOWED_ORIGINS = [
  'https://overglow-v1-3jqp.vercel.app',
  'https://overglow-v1.vercel.app',
  'https://overglow-frontend.vercel.app',
  'https://overglow-backend.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

/**
 * Construit la liste finale des origines autorisées.
 * FRONTEND_URL et CORS_ALLOWED_ORIGINS (CSV) peuvent étendre la liste.
 */
export const getAllowedOrigins = () => {
  const origins = [...DEFAULT_ALLOWED_ORIGINS];

  if (process.env.FRONTEND_URL) {
    origins.push(String(process.env.FRONTEND_URL).trim().replace(/\/$/, ''));
  }

  if (process.env.CORS_ALLOWED_ORIGINS) {
    String(process.env.CORS_ALLOWED_ORIGINS)
      .split(',')
      .map((o) => o.trim().replace(/\/$/, ''))
      .filter(Boolean)
      .forEach((o) => origins.push(o));
  }

  return [...new Set(origins)];
};

/**
 * Vérifie si une Origin est explicitement autorisée.
 * Pas de matching sous-domaine / includes('vercel.app').
 */
export const isOriginAllowed = (origin) => {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
};

/**
 * Pose les en-têtes CORS uniquement si l'origine est allowlistée.
 * Ne reflète jamais une origine inconnue (évite CORS reflection).
 */
export const setCORSHeaders = (req, res) => {
  const origin = req.headers?.origin;

  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', CORS_METHODS.join(', '));
  res.setHeader('Access-Control-Allow-Headers', CORS_ALLOWED_HEADERS.join(', '));
  res.setHeader('Access-Control-Max-Age', '86400');
};

/**
 * Options pour le middleware `cors` d'Express.
 * Requêtes sans Origin (webhooks, health, curl) : autorisées.
 */
export const corsOptions = {
  origin(origin, callback) {
    // Clients non-navigateur (Stripe/PayPal webhooks, health checks, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    logger.warn(`[CORS] blocked origin: ${origin}`);
    return callback(new Error(`CORS: origin ${origin} not allowed`), false);
  },
  credentials: true,
  methods: CORS_METHODS,
  allowedHeaders: CORS_ALLOWED_HEADERS,
  maxAge: 86400,
};

export default {
  getAllowedOrigins,
  isOriginAllowed,
  setCORSHeaders,
  corsOptions,
  CORS_METHODS,
  CORS_ALLOWED_HEADERS,
  DEFAULT_ALLOWED_ORIGINS,
};
