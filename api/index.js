// Vercel serverless function entry point
// This file handles requests BEFORE importing the Express app
// This ensures OPTIONS requests are handled even if app initialization fails

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
  
  // Check if origin is allowed
  if (origin && (allowedOrigins.includes(origin) || origin.includes('vercel.app') || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Allow requests without origin
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // For other origins, still allow (permissive for now)
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  res.setHeader('Access-Control-Max-Age', '86400');
};

export default async (req, res) => {
  try {
    // CRITICAL: Handle OPTIONS FIRST, before ANY imports or initialization
    // This must happen before we even try to import the Express app
    if (req.method === 'OPTIONS') {
      setCORSHeaders(req, res);
      return res.status(200).end();
    }
    
    // Set CORS headers for all requests
    setCORSHeaders(req, res);
    
    // Now import and use the Express app for non-OPTIONS requests
    // Dynamic import to ensure it only happens after OPTIONS is handled
    const { default: app } = await import('../server.js');
    return app(req, res);
  } catch (error) {
    console.error('API handler error:', error);
    
    // Always set CORS headers, even on error
    setCORSHeaders(req, res);
    
    // Even on error, try to handle OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // For non-OPTIONS errors, return 500 with CORS headers
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
