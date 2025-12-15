/**
 * Sentry Error Monitoring Configuration
 * Initialize Sentry for backend error tracking
 */

import * as Sentry from '@sentry/node';

const SENTRY_DSN = process.env.SENTRY_DSN || '';

export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Set SENTRY_DSN in .env');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      // Enable HTTP tracing
      Sentry.httpIntegration(),
      // Enable Express integration
      Sentry.expressIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in production
    
    // Filter out common non-critical errors
    beforeSend(event, hint) {
      // Ignore 404 errors
      if (event.exception) {
        const error = hint.originalException;
        if (error && error.statusCode === 404) {
          return null;
        }
      }
      
      // Ignore validation errors (they're expected)
      if (event.tags && event.tags.validation) {
        return null;
      }
      
      return event;
    },
    
    // Set initial tags
    initialScope: {
      tags: {
        component: 'backend',
      },
    },
  });
};

/**
 * Capture exception manually
 */
export const captureException = (error, context = {}) => {
  if (!SENTRY_DSN) {
    console.error('Sentry not initialized:', error, context);
    return;
  }
  
  Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Capture message manually
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  if (!SENTRY_DSN) {
    console.log(`[${level.toUpperCase()}]`, message, context);
    return;
  }
  
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (message, category = 'default', level = 'info', data = {}) => {
  if (!SENTRY_DSN) return;
  
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
};

/**
 * Set user context for Sentry
 */
export const setSentryUser = (user) => {
  if (!SENTRY_DSN) return;
  
  Sentry.setUser({
    id: user._id?.toString() || user.id?.toString(),
    email: user.email,
    username: user.name,
  });
};

/**
 * Clear user context
 */
export const clearSentryUser = () => {
  if (!SENTRY_DSN) return;
  Sentry.setUser(null);
};

