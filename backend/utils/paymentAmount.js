/**
 * [TASK-2] Comparaison sécurisée des montants de paiement.
 * Tolérance 0.01 pour les arrondis float / devises.
 */

export const AMOUNT_TOLERANCE = 0.01;

/**
 * Compare deux montants avec tolérance.
 * @param {number|string} expected
 * @param {number|string} received
 * @param {number} [tolerance=AMOUNT_TOLERANCE]
 * @returns {boolean}
 */
export const amountsMatch = (expected, received, tolerance = AMOUNT_TOLERANCE) => {
  const a = Number(expected);
  const b = Number(received);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  // Compare in cents to avoid IEEE float edge cases (e.g. 100 vs 100.01)
  const expectedCents = Math.round(a * 100);
  const receivedCents = Math.round(b * 100);
  const toleranceCents = Math.round(tolerance * 100);
  return Math.abs(expectedCents - receivedCents) <= toleranceCents;
};

/**
 * Normalise un montant monétaire à 2 décimales.
 * @param {number|string} value
 * @returns {number|null}
 */
export const normalizeMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
};

/**
 * Valide qu'un montant client correspond au total booking.
 * @param {{ expected: number|string, received: number|string|null|undefined, requireReceived?: boolean }}
 * @returns {{ ok: true, expected: number } | { ok: false, reason: string, expected?: number, received?: number|null }}
 */
export const validatePaymentAmount = ({ expected, received, requireReceived = false }) => {
  const expectedAmount = normalizeMoney(expected);
  if (expectedAmount === null || expectedAmount <= 0) {
    return { ok: false, reason: 'Invalid expected booking amount' };
  }

  if (received === undefined || received === null || received === '') {
    if (requireReceived) {
      return { ok: false, reason: 'Payment amount is required', expected: expectedAmount, received: null };
    }
    return { ok: true, expected: expectedAmount };
  }

  const receivedAmount = normalizeMoney(received);
  if (receivedAmount === null) {
    return { ok: false, reason: 'Invalid received payment amount', expected: expectedAmount, received: null };
  }

  if (!amountsMatch(expectedAmount, receivedAmount)) {
    return {
      ok: false,
      reason: 'Amount does not match booking total',
      expected: expectedAmount,
      received: receivedAmount,
    };
  }

  return { ok: true, expected: expectedAmount };
};

export default {
  AMOUNT_TOLERANCE,
  amountsMatch,
  normalizeMoney,
  validatePaymentAmount,
};
