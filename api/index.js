// Vercel serverless function entry point
// This file handles requests BEFORE importing the Express app
// This ensures CORS headers are ALWAYS set, even on errors

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
        code: error.code
      });
      throw error;
    }
  })();
  
  return appPromise;
};

const allowedOrigins = [
  'https://overglow-v1-3jqp.vercel.app',
  'https://overglow-v1.vercel.app',
  'https://overglow-frontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
];

const setCORSHeaders = (req, res) => {
  const origin = req.headers.origin;
  
  // Always set CORS headers - be permissive
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  res.setHeader('Access-Control-Max-Age', '86400');
};

export default async (req, res) => {
  // CRITICAL: Set CORS headers FIRST, before ANYTHING else
  // This MUST happen before any async operations
  setCORSHeaders(req, res);
  
  // Handle OPTIONS preflight immediately
  if (req.method === 'OPTIONS') {
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
      name: loadError.name
    });
    
    // CORS headers already set above
    return res.status(500).json({ 
      message: 'Server initialization error',
      error: process.env.NODE_ENV === 'development' ? loadError.message : undefined
    });
  }
  
  // Call the Express app handler
  // Express app may not return a promise, so we call it directly
  // The CORS headers are already set above, so they'll be included in the response
  try {
    // Call the Express app - it handles the request/response
    expressApp(req, res);
  } catch (appError) {
    console.error('Express app error:', {
      message: appError.message,
      stack: appError.stack,
      name: appError.name
    });
    
    // Only send error if headers haven't been sent yet
    if (!res.headersSent) {
      // Ensure CORS headers are set (they should already be, but double-check)
      setCORSHeaders(req, res);
      return res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? appError.message : undefined
      });
    }
  }
};
