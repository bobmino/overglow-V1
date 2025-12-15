/**
 * Structured logging utility
 */

const logLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLogLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG');

const shouldLog = (level) => {
  return logLevels[level] <= logLevels[currentLogLevel];
};

const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  return {
    timestamp,
    level,
    message,
    ...meta,
    environment: process.env.NODE_ENV || 'development',
  };
};

export const logger = {
  error: (message, meta = {}) => {
    if (shouldLog('ERROR')) {
      const logData = formatLog('ERROR', message, meta);
      console.error(JSON.stringify(logData));
    }
  },

  warn: (message, meta = {}) => {
    if (shouldLog('WARN')) {
      const logData = formatLog('WARN', message, meta);
      console.warn(JSON.stringify(logData));
    }
  },

  info: (message, meta = {}) => {
    if (shouldLog('INFO')) {
      const logData = formatLog('INFO', message, meta);
      console.log(JSON.stringify(logData));
    }
  },

  debug: (message, meta = {}) => {
    if (shouldLog('DEBUG')) {
      const logData = formatLog('DEBUG', message, meta);
      console.log(JSON.stringify(logData));
    }
  },

  // Security-specific logging
  security: {
    failedLogin: (email, ip, attempts) => {
      logger.warn('Failed login attempt', {
        type: 'SECURITY',
        event: 'FAILED_LOGIN',
        email,
        ip,
        attempts,
      });
    },

    accountLocked: (email, ip, lockedUntil) => {
      logger.error('Account locked', {
        type: 'SECURITY',
        event: 'ACCOUNT_LOCKED',
        email,
        ip,
        lockedUntil,
      });
    },

    rateLimitExceeded: (ip, endpoint, limit) => {
      logger.warn('Rate limit exceeded', {
        type: 'SECURITY',
        event: 'RATE_LIMIT_EXCEEDED',
        ip,
        endpoint,
        limit,
      });
    },

    tokenRefresh: (userId, success) => {
      logger.info('Token refresh', {
        type: 'SECURITY',
        event: 'TOKEN_REFRESH',
        userId,
        success,
      });
    },
  },
};

