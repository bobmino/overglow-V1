// Vercel serverless function entry point
// This file handles requests BEFORE importing the Express app
// This ensures CORS headers are ALWAYS set, even on errors

import { setCORSHeaders } from '../backend/config/cors.js';
import { logger } from '../backend/utils/logger.js';

// Try to import server.js, but handle failures gracefully
let app = null;
let appPromise = null;

const isProduction = () =>
  process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

/** Strip absolute paths / home dirs from error messages (safe ops hint). */
const safeHint = (error) => {
  const raw = String(error?.message || error || 'unknown');
  return raw
    .replace(/[A-Za-z]:\\[^\s'"]+/g, '[path]')
    .replace(/\/(?:home|Users|var|tmp|opt|app)\/[^\s'"]+/g, '[path]')
    .replace(/file:\/\/[^\s'"]+/g, '[path]')
    .slice(0, 240);
};

/**
 * [TASK-5] Réponse d'erreur sûre — jamais de stack complète en prod.
 * Inclut fault.name/code/hint pour diagnostiquer les échecs de cold start.
 */
const sendSafeError = (req, res, statusCode, publicMessage, error) => {
  const timestamp = new Date().toISOString();
  const fault = {
    name: error?.name || 'Error',
    code: error?.code || undefined,
    hint: safeHint(error),
  };

  logger.error('[api/index] error', {
    timestamp,
    method: req?.method,
    url: req?.url,
    message: error?.message,
    name: error?.name,
    code: error?.code,
    stack: error?.stack,
  });

  if (isProduction()) {
    return res.status(statusCode).json({
      success: false,
      error: publicMessage,
      statusCode,
      fault,
    });
  }

  return res.status(statusCode).json({
    success: false,
    error: publicMessage,
    statusCode,
    fault,
    debug: {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      stack: error?.stack,
    },
  });
};

// Lazy load the app to avoid blocking module initialization
const loadApp = async () => {
  if (app) return app;
  if (appPromise) return appPromise;

  appPromise = (async () => {
    try {
      const module = await import('../server.js');
      app = module.default;
      return app;
    } catch (error) {
      logger.error('Failed to load server.js:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        cause: error.cause,
      });
      // Allow retry on next invocation after a cold-start failure
      appPromise = null;
      throw error;
    }
  })();

  return appPromise;
};

export default async (req, res) => {
  // Handle OPTIONS preflight immediately — set CORS only here
  if (req.method === 'OPTIONS') {
    setCORSHeaders(req, res);
    return res.status(200).end();
  }

  // Load the app (lazy loading)
  let expressApp;
  try {
    expressApp = await loadApp();

    if (!expressApp) {
      throw new Error('Express app not loaded');
    }
  } catch (loadError) {
    setCORSHeaders(req, res);
    return sendSafeError(
      req,
      res,
      500,
      'Internal Server Error',
      loadError
    );
  }

  // Let Express handle the request — Express cors() middleware sets CORS headers.
  // Do NOT set CORS here to avoid duplicate Access-Control-Allow-Origin values.
  try {
    expressApp(req, res);
  } catch (appError) {
    if (!res.headersSent) {
      setCORSHeaders(req, res);
      return sendSafeError(
        req,
        res,
        500,
        'Internal Server Error',
        appError
      );
    }
  }
};
