/**
 * Sentry Error Monitoring Configuration
 * Initialize Sentry for frontend error tracking
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';

export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Set VITE_SENTRY_DSN in .env');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production, 100% in dev
    // Session Replay
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0, // Always record replays on errors
    
    // Filter out common non-critical errors
    beforeSend(event, hint) {
      // Ignore network errors
      if (event.exception) {
        const error = hint.originalException;
        if (error && (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch'))) {
          return null;
        }
      }
      return event;
    },
    
    // Set user context if available
    initialScope: {
      tags: {
        component: 'frontend',
      },
    },
  });
};

/**
 * Set user context for Sentry
 */
export const setSentryUser = (user) => {
  if (!SENTRY_DSN) return;
  
  Sentry.setUser({
    id: user._id || user.id,
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

