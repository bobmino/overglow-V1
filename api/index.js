// Vercel serverless function entry point
// This file handles requests BEFORE importing the Express app
// This ensures CORS headers are ALWAYS set, even on errors

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
  setCORSHeaders(req, res);
  
  // Handle OPTIONS preflight immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Import the Express app
    let app;
    try {
      const module = await import('../server.js');
      app = module.default;
      
      if (!app) {
        throw new Error('Express app not exported from server.js');
      }
    } catch (importError) {
      console.error('Failed to import server.js:', {
        message: importError.message,
        stack: importError.stack,
        name: importError.name
      });
      
      return res.status(500).json({ 
        message: 'Server initialization error',
        error: process.env.NODE_ENV === 'development' ? importError.message : undefined
      });
    }
    
    // Call the Express app handler
    // Wrap in try-catch to ensure CORS headers are always set on errors
    try {
      return await app(req, res);
    } catch (appError) {
      console.error('Express app error:', {
        message: appError.message,
        stack: appError.stack,
        name: appError.name
      });
      
      // CORS headers already set above
      return res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? appError.message : undefined
      });
    }
  } catch (error) {
    console.error('API handler error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // CORS headers already set above
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
