/**
 * Structured logger — backend (task [18]).
 * Dev: human-readable lines | Prod: JSON (one object per line).
 * Never log passwords, tokens, or full card numbers.
 */
import { randomUUID } from 'crypto';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, fatal: 50 };

const SENSITIVE_KEYS = new Set([
  'password',
  'passwd',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'secret',
  'apiKey',
  'apikey',
  'cardNumber',
  'cvv',
  'cvc',
  'iban',
  'storeKey',
  'cmi_store_key',
]);

const envLevel = (process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')).toLowerCase();
const minLevel = LEVELS[envLevel] ?? LEVELS.info;
const isProd = process.env.NODE_ENV === 'production';

const COLORS = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  fatal: '\x1b[35m',
  reset: '\x1b[0m',
};

export const redact = (value, depth = 0) => {
  if (value == null || depth > 5) return value;
  if (typeof value === 'string') {
    if (value.length > 500) return `${value.slice(0, 500)}…[truncated]`;
    return value;
  }
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === 'object') {
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        ...(isProd ? {} : { stack: value.stack }),
      };
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(k) || /password|token|secret|authorization|cvv|iban/i.test(k)) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = redact(v, depth + 1);
      }
    }
    return out;
  }
  return value;
};

const write = (level, message, meta = {}, bindings = {}) => {
  if ((LEVELS[level] ?? 99) < minLevel) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message: typeof message === 'string' ? message : String(message),
    ...bindings,
    ...(Object.keys(meta).length ? { meta: redact(meta) } : {}),
    env: process.env.NODE_ENV || 'development',
  };

  if (meta instanceof Error || meta?.err instanceof Error) {
    const err = meta instanceof Error ? meta : meta.err;
    entry.error = redact(err);
  }

  const line = isProd
    ? JSON.stringify(entry)
    : `${COLORS[level] || ''}[${entry.timestamp}] ${level.toUpperCase()}${COLORS.reset} ${entry.message}${
        entry.meta ? ` ${JSON.stringify(entry.meta)}` : ''
      }${entry.error?.stack && !isProd ? `\n${entry.error.stack}` : ''}`;

  if (level === 'error' || level === 'fatal') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
};

const makeLogger = (bindings = {}) => ({
  debug: (msg, meta) => write('debug', msg, meta, bindings),
  info: (msg, meta) => write('info', msg, meta, bindings),
  warn: (msg, meta) => write('warn', msg, meta, bindings),
  error: (msg, meta) => write('error', msg, meta, bindings),
  fatal: (msg, meta) => write('fatal', msg, meta, bindings),
  child: (extra = {}) => makeLogger({ ...bindings, ...extra }),
  security: {
    failedLogin: (email, ip, attempts) =>
      write('warn', 'Failed login attempt', { type: 'SECURITY', event: 'FAILED_LOGIN', email, ip, attempts }, bindings),
    accountLocked: (email, ip, lockedUntil) =>
      write('error', 'Account locked', { type: 'SECURITY', event: 'ACCOUNT_LOCKED', email, ip, lockedUntil }, bindings),
    rateLimitExceeded: (ip, endpoint, limit) =>
      write('warn', 'Rate limit exceeded', { type: 'SECURITY', event: 'RATE_LIMIT_EXCEEDED', ip, endpoint, limit }, bindings),
    tokenRefresh: (userId, success) =>
      write('info', 'Token refresh', { type: 'SECURITY', event: 'TOKEN_REFRESH', userId, success }, bindings),
  },
});

export const logger = makeLogger({ service: 'overglow-api' });

export const createRequestId = () => randomUUID();

export default logger;
