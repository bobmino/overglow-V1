import { captureException } from '../utils/sentry.js';

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  // SPECIAL HANDLING FOR BLOG ROUTES - Always return valid responses instead of 500
  if (req.path && (req.path.includes('/blog') || req.originalUrl.includes('/blog'))) {
    console.error('[BLOG] Error intercepted by errorHandler:', err?.message || err);
    
    // Set CORS headers
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Return valid responses based on path
    if (req.path === '/categories' || req.originalUrl.includes('/categories')) {
      return res.status(200).json({ categories: [] });
    }
    if (req.path === '/tags' || req.originalUrl.includes('/tags')) {
      return res.status(200).json({ tags: [] });
    }
    if (req.path === '/' || req.originalUrl.endsWith('/api/blog')) {
      return res.status(200).json({ posts: [], pagination: { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 10, total: 0, totalPages: 0 } });
    }
    return res.status(404).json({ message: 'Article non trouvé' });
  }
  
  // Normal error handling for other routes
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  
  // Ensure CORS headers are set even on errors
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
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Log error details for debugging
  console.error('Error Handler:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
    statusCode,
    path: req.path,
    method: req.method,
  });
  
  // Send to Sentry (only for non-404 errors and production)
  if (statusCode !== 404 && process.env.NODE_ENV === 'production') {
    captureException(err, {
      req: {
        url: req.url,
        method: req.method,
        headers: req.headers,
        query: req.query,
        body: req.body,
      },
      statusCode,
    });
  }
  
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    ...(process.env.NODE_ENV === 'development' && { 
      name: err.name,
      path: req.path,
      method: req.method,
    }),
  });
};

export { notFound, errorHandler };
