import { captureException } from '../utils/sentry.js';
import { logger } from '../utils/logger.js';
import { setCORSHeaders } from '../config/cors.js';

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  // SPECIAL HANDLING FOR BLOG ROUTES - Always return valid responses instead of 500
  if (req.path && (req.path.includes('/blog') || req.originalUrl.includes('/blog'))) {
    logger.error('Blog route error intercepted', {
      message: err?.message || String(err),
      path: req.path,
      requestId: req.requestId,
    });

    // CORS allowlist centralisée (pas de reflection d'origine arbitraire)
    setCORSHeaders(req, res);

    // Return valid responses based on path
    if (req.path === '/categories' || req.originalUrl.includes('/categories')) {
      return res.status(200).json({ categories: [] });
    }
    if (req.path === '/tags' || req.originalUrl.includes('/tags')) {
      return res.status(200).json({ tags: [] });
    }
    if (req.path === '/' || req.originalUrl.endsWith('/api/blog')) {
      return res.status(200).json({
        posts: [],
        pagination: {
          page: parseInt(req.query.page) || 1,
          limit: parseInt(req.query.limit) || 10,
          total: 0,
          totalPages: 0,
        },
      });
    }
    return res.status(404).json({ message: 'Article non trouvé' });
  }

  // Normal error handling for other routes
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  // Ensure CORS headers are set even on errors (centralized allowlist)
  setCORSHeaders(req, res);

  // Log error details for debugging/observability
  logger.error('Unhandled API error', {
    message: err?.message,
    stack: err?.stack,
    name: err?.name,
    statusCode,
    path: req.path,
    method: req.method,
  });

  // Always capture server errors in Sentry when available
  if (statusCode >= 500) {
    captureException(err, {
      req: {
        url: req.url,
        method: req.method,
        headers: req.headers,
        query: req.query,
      },
      statusCode,
    });
  }

  // Only hide raw error payloads for server errors (>= 500)
  if (statusCode >= 500) {
    res.json({
      success: false,
      error: 'Internal Server Error',
      message: 'Service momentanément indisponible',
      statusCode,
    });
  } else {
    res.json({
      success: false,
      error: err.message || 'Request failed',
      message: err.message || 'Service momentanément indisponible',
      statusCode,
    });
  }
};

export { notFound, errorHandler };
