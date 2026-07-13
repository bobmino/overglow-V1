// Vercel serverless function entry point
// This file handles requests BEFORE importing the Express app
// This ensures CORS headers are ALWAYS set, even on errors

import { setCORSHeaders } from '../backend/config/cors.js';

// Try to import server.js, but handle failures gracefully
let app = null;
let appPromise = null;

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
      console.error('Failed to load server.js:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        cause: error.cause,
        fullError: error,
      });
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
    console.error('Failed to load Express app:', {
      message: loadError.message,
      stack: loadError.stack,
      name: loadError.name,
      code: loadError.code,
      cause: loadError.cause,
    });

    // Set CORS only on error fallback (Express won't handle this)
    setCORSHeaders(req, res);
    return res.status(500).json({
      message: 'Server initialization error',
      error: loadError.message,
      errorType: loadError.name,
      errorCode: loadError.code,
      stack: loadError.stack,
    });
  }

  // Let Express handle the request — Express cors() middleware sets CORS headers.
  // Do NOT set CORS here to avoid duplicate Access-Control-Allow-Origin values.
  try {
    expressApp(req, res);
  } catch (appError) {
    console.error('Express app error:', {
      message: appError.message,
      stack: appError.stack,
      name: appError.name,
    });

    if (!res.headersSent) {
      setCORSHeaders(req, res);
      return res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? appError.message : undefined,
      });
    }
  }
};
