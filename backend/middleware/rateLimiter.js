import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

// Rate limiter pour authentification (login, register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max par IP
  message: {
    error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
    retryAfter: 15,
  },
  standardHeaders: true, // Retourne rate limit info dans headers `RateLimit-*`
  legacyHeaders: false, // Désactive `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Compter aussi les requêtes réussies
  skipFailedRequests: false, // Compter aussi les requêtes échouées
  handler: (req, res) => {
    // Set CORS headers before sending error
    const origin = req.headers.origin;
    const allowedOrigins = [
      'https://overglow-v1-3jqp.vercel.app',
      'https://overglow-v1.vercel.app',
      'https://overglow-frontend.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174',
    ];
    
    if (origin && (allowedOrigins.includes(origin) || origin.includes('vercel.app') || origin.includes('localhost'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    logger.security.rateLimitExceeded(
      req.ip || req.connection.remoteAddress,
      req.path,
      5
    );
    
    res.status(429).json({
      error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
      retryAfter: 15,
    });
  },
});

// Rate limiter général pour API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max par IP
  message: {
    error: 'Trop de requêtes. Veuillez réessayer plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter strict pour endpoints sensibles (upload, paiement)
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requêtes max par IP
  message: {
    error: 'Trop de requêtes sur cet endpoint. Veuillez réessayer plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

