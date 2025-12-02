// Vercel serverless function entry point
// This file handles requests BEFORE importing the Express app
// This ensures OPTIONS requests are handled even if app initialization fails

export default async (req, res) => {
  try {
    // CRITICAL: Handle OPTIONS FIRST, before ANY imports or initialization
    // This must happen before we even try to import the Express app
    if (req.method === 'OPTIONS') {
      const origin = req.headers.origin || '*';
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(200).end();
    }
    
    // Now import and use the Express app for non-OPTIONS requests
    // Dynamic import to ensure it only happens after OPTIONS is handled
    const { default: app } = await import('../server.js');
    return app(req, res);
  } catch (error) {
    console.error('API handler error:', error);
    
    // Even on error, try to handle OPTIONS
    if (req.method === 'OPTIONS') {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        return res.status(200).end();
      } catch (e) {
        return res.status(200).end();
      }
    }
    
    // For non-OPTIONS errors, return 500 with CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
