/**
 * Frontend structured logger (task [18]).
 * Silent for debug/info in production builds unless VITE_LOG_LEVEL is set.
 */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, fatal: 50 };

const SENSITIVE = /password|token|secret|authorization|cardNumber|cvv|iban/i;

const envLevel = (
  import.meta.env.VITE_LOG_LEVEL ||
  (import.meta.env.PROD ? 'warn' : 'debug')
).toLowerCase();
const minLevel = LEVELS[envLevel] ?? LEVELS.warn;

const redact = (meta) => {
  if (!meta || typeof meta !== 'object') return meta;
  if (meta instanceof Error) {
    return { name: meta.name, message: meta.message, stack: import.meta.env.DEV ? meta.stack : undefined };
  }
  const out = {};
  for (const [k, v] of Object.entries(meta)) {
    out[k] = SENSITIVE.test(k) ? '[REDACTED]' : v;
  }
  return out;
};

const emit = (level, message, meta, bindings) => {
  if ((LEVELS[level] ?? 99) < minLevel) return;
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...bindings,
    ...(meta ? { meta: redact(meta) } : {}),
  };
  const args = import.meta.env.PROD ? [JSON.stringify(entry)] : [`[${level}]`, message, meta ? redact(meta) : ''];
  if (level === 'error' || level === 'fatal') console.error(...args);
  else if (level === 'warn') console.warn(...args);
  else console.log(...args);
};

const makeLogger = (bindings = {}) => ({
  debug: (msg, meta) => emit('debug', msg, meta, bindings),
  info: (msg, meta) => emit('info', msg, meta, bindings),
  warn: (msg, meta) => emit('warn', msg, meta, bindings),
  error: (msg, meta) => emit('error', msg, meta, bindings),
  fatal: (msg, meta) => emit('fatal', msg, meta, bindings),
  child: (extra = {}) => makeLogger({ ...bindings, ...extra }),
});

export const logger = makeLogger({ service: 'overglow-web' });
export default logger;
