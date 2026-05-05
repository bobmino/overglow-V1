import NodeCache from 'node-cache';
import { logger } from '../utils/logger.js';

// Initialize the cache with default settings
// stdTTL: standard time to live in seconds (default 0 = unlimited)
// checkperiod: period in seconds for the automatic delete check interval
const cache = new NodeCache({ stdTTL: 0, checkperiod: 120 });

/**
 * Cache middleware generator
 * @param {number} duration - Cache duration in seconds
 * @returns {Function} Express middleware function
 */
export const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Build the cache key based on original URL (includes query string)
    const key = `__express__${req.originalUrl || req.url}`;
    
    // Check if key exists in cache
    const cachedBody = cache.get(key);
    
    if (cachedBody) {
      // Cache HIT
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedBody);
    } else {
      // Cache MISS
      res.setHeader('X-Cache', 'MISS');
      
      // Override res.json to intercept the response and cache it
      const originalJson = res.json;
      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(key, body, duration);
        }
        
        // Restore original res.json and call it
        res.json = originalJson;
        return res.json(body);
      };
      
      next();
    }
  };
};

/**
 * Manually clear cache entries that match a prefix or exact key
 * @param {string|RegExp|null} pattern - The pattern to match, or null to clear everything
 */
export const clearCache = (pattern = null) => {
  try {
    if (!pattern) {
      cache.flushAll();
      logger.info('Cache completely flushed');
      return;
    }
    
    const keys = cache.keys();
    let keysToDelete = [];
    
    if (pattern instanceof RegExp) {
      keysToDelete = keys.filter(k => pattern.test(k));
    } else if (typeof pattern === 'string') {
      // Clear exact match or prefix
      keysToDelete = keys.filter(k => k === pattern || k.startsWith(`__express__${pattern}`));
    }
    
    if (keysToDelete.length > 0) {
      cache.del(keysToDelete);
      logger.info(`Cache cleared for ${keysToDelete.length} keys matching ${pattern}`);
    }
  } catch (error) {
    logger.error('Error clearing cache:', error);
  }
};

export default {
  cacheMiddleware,
  clearCache,
  instance: cache
};
