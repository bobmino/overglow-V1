import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

const isProduction = () =>
  process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

/**
 * [TASK-9] Health public minimal en prod.
 * @route GET /api/health
 */
router.get('/', async (req, res) => {
  try {
    const dbOk = mongoose.connection.readyState === 1;
    const status = dbOk ? 'ok' : 'degraded';
    const statusCode = dbOk ? 200 : 503;

    if (isProduction()) {
      return res.status(statusCode).json({
        status,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(statusCode).json({
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbOk ? 'connected' : 'disconnected',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * [TASK-9] Health détaillé — réservé aux checks internes / Vercel.
 * Accepte: header x-health-key === HEALTH_CHECK_KEY, ou non-production.
 * @route GET /api/health/detailed
 */
router.get('/detailed', async (req, res) => {
  const key = req.headers['x-health-key'] || req.query.key;
  const allowed =
    !isProduction()
    || (process.env.HEALTH_CHECK_KEY && key === process.env.HEALTH_CHECK_KEY)
    || req.headers['x-vercel-id']
    || req.headers['x-vercel-deployment-url'];

  if (!allowed) {
    return res.status(403).json({ status: 'forbidden' });
  }

  const dbOk = mongoose.connection.readyState === 1;
  return res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: dbOk ? 'connected' : 'disconnected',
    },
  });
});

export default router;
