/**
 * [TASK-20] Payment simulator guard.
 * Default: disabled. In production, simulation is always refused (403 path).
 * ENABLE_PAYMENT_SIM=true only allowed outside production (or logs a WARNING if set in prod).
 */
import { logger } from './logger.js';

const truthy = (v) => ['1', 'true', 'yes', 'on'].includes(String(v || '').trim().toLowerCase());

export const isProductionEnv = () =>
  process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

/** Raw flag from env (does not imply simulation is allowed). */
export const isPaymentSimFlagOn = () => truthy(process.env.ENABLE_PAYMENT_SIM);

/**
 * Simulation is allowed only when explicitly enabled AND not in production.
 */
export const isPaymentSimAllowed = () => {
  if (isProductionEnv()) return false;
  return isPaymentSimFlagOn();
};

/**
 * Call at boot. Never crashes the process.
 * Warns if ENABLE_PAYMENT_SIM=true in production (ignored).
 */
export const validatePaymentSimAtStartup = () => {
  const flagOn = isPaymentSimFlagOn();
  const prod = isProductionEnv();

  if (prod && flagOn) {
    logger.warn(
      '[paymentSim] ENABLE_PAYMENT_SIM=true in production — simulation FORCED OFF (flag ignored)'
    );
    return { allowed: false, warned: true };
  }

  if (flagOn) {
    logger.warn('[paymentSim] Payment simulator ENABLED (non-production only)');
    return { allowed: true, warned: false };
  }

  logger.info('[paymentSim] Payment simulator disabled (ENABLE_PAYMENT_SIM=false)');
  return { allowed: false, warned: false };
};

/**
 * Detect mock/sim payment IDs from clients.
 */
export const isMockPaymentId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return (
    id.startsWith('mock_') ||
    id.startsWith('sim_') ||
    id === 'mock_paypal_id' ||
    id.includes('mock_secret')
  );
};

export default {
  isProductionEnv,
  isPaymentSimFlagOn,
  isPaymentSimAllowed,
  validatePaymentSimAtStartup,
  isMockPaymentId,
};
