/**
 * Request ID + access logging middleware (task [18]).
 */
import { createRequestId, logger } from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  const incoming = req.headers['x-request-id'];
  const requestId = typeof incoming === 'string' && incoming.trim() ? incoming.trim() : createRequestId();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const start = Date.now();
  const log = logger.child({ requestId, module: 'http' });

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const payload = {
      method: req.method,
      path: req.originalUrl?.split('?')[0] || req.path,
      status: res.statusCode,
      durationMs,
      ip: req.ip || req.headers['x-forwarded-for'],
    };
    if (res.statusCode >= 500) log.error('HTTP request failed', payload);
    else if (res.statusCode >= 400) log.warn('HTTP request client error', payload);
    else log.info('HTTP request', payload);
  });

  next();
};

export default requestLogger;
