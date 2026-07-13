/**
 * [TASK-3] Validation des variables d'environnement paiements (CMI + virement).
 * Ne jamais logger IBAN / SWIFT / CMI_STORE_KEY en clair.
 */

const isProduction = () =>
  process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

/**
 * Retourne la clé CMI sans fallback hardcodé.
 * @throws {Error} si absente
 */
export const getCmiStoreKey = () => {
  const key = process.env.CMI_STORE_KEY;
  if (!key || key === 'your_cmi_store_key') {
    throw new Error(
      'CMI_STORE_KEY is missing or invalid. Set a real store key in the environment — no hardcoded fallback.'
    );
  }
  return key;
};

/**
 * Coordonnées bancaires depuis l'env (jamais hardcodées).
 * @throws {Error} si IBAN ou SWIFT absents
 */
export const getBankCredentials = () => {
  const iban = process.env.BANK_IBAN?.trim();
  const swift = process.env.BANK_SWIFT?.trim();
  const bankName = process.env.BANK_NAME?.trim() || 'Attijariwafa Bank';
  const accountName = process.env.BANK_ACCOUNT_NAME?.trim() || 'Overglow Trip SARL';

  if (!iban || !swift) {
    throw new Error(
      'BANK_IBAN and BANK_SWIFT must be configured in the environment (no hardcoded bank details).'
    );
  }

  return { iban, swift, bankName, accountName };
};

/**
 * Validation au démarrage (server.js).
 * En production: échec fatal si secrets bancaires / CMI absents.
 * En développement: warning (permet le boot local sans CMI).
 */
export const validatePaymentEnvAtStartup = () => {
  const missing = [];

  if (!process.env.BANK_IBAN?.trim()) missing.push('BANK_IBAN');
  if (!process.env.BANK_SWIFT?.trim()) missing.push('BANK_SWIFT');
  if (!process.env.CMI_STORE_KEY?.trim() || process.env.CMI_STORE_KEY === 'your_cmi_store_key') {
    missing.push('CMI_STORE_KEY');
  }

  if (missing.length === 0) {
    console.log('[paymentEnv] Payment environment variables OK (values not logged)');
    return { ok: true, missing: [] };
  }

  const message = `[paymentEnv] Missing required payment env vars: ${missing.join(', ')}`;

  if (isProduction()) {
    // [TASK-3] Échec explicite au démarrage en production
    throw new Error(message);
  }

  console.warn(`${message} — payment endpoints that need them will return 503 until configured.`);
  return { ok: false, missing };
};

export default {
  getCmiStoreKey,
  getBankCredentials,
  validatePaymentEnvAtStartup,
};
