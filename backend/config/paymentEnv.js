import { logger } from '../utils/logger.js';

/**
 * [TASK-3] Validation des variables d'environnement paiements (CMI + virement).
 * Ne jamais logger IBAN / SWIFT / CMI_STORE_KEY en clair.
 *
 * Coordonnées bancaires : Settings (BO admin) > env > défauts soft-launch.
 */

/** Exemple soft-launch (modifiable dans Admin → Paramètres → Paiements). */
export const DEMO_BANK_CREDENTIALS = Object.freeze({
  iban: 'MA640070012345678901234567',
  swift: 'BCMAMAMC',
  bankName: 'Attijariwafa Bank',
  accountName: 'Overglow Trip SARL',
});

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

const readSettingMap = async () => {
  try {
    const Settings = (await import('../models/settingsModel.js')).default;
    const rows = await Settings.find({
      key: { $in: ['bankIban', 'bankSwift', 'bankName', 'bankAccountName'] },
    }).lean();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch (err) {
    logger.warn('[paymentEnv] Could not read bank settings from DB:', err.message);
    return {};
  }
};

/**
 * Persist demo bank settings once so Admin BO can edit them.
 */
export const ensureBankSettingsSeeded = async () => {
  try {
    const Settings = (await import('../models/settingsModel.js')).default;
    const defaults = Settings.getDefaultSettings();
    const pairs = [
      ['bankIban', defaults.bankIban, 'IBAN Overglow (virement checkout)'],
      ['bankSwift', defaults.bankSwift, 'SWIFT / BIC Overglow'],
      ['bankName', defaults.bankName, 'Nom de la banque'],
      ['bankAccountName', defaults.bankAccountName, 'Titulaire du compte'],
    ];
    for (const [key, value, description] of pairs) {
      const existing = await Settings.findOne({ key });
      if (!existing) {
        await Settings.create({ key, value, description });
      }
    }
  } catch (err) {
    logger.warn('[paymentEnv] Bank settings seed skipped:', err.message);
  }
};

/**
 * Coordonnées bancaires : Settings BO > env > défauts soft-launch.
 * @returns {Promise<{ iban: string, swift: string, bankName: string, accountName: string }>}
 */
export const getBankCredentials = async () => {
  const map = await readSettingMap();
  const Settings = (await import('../models/settingsModel.js')).default;
  const defaults = Settings.getDefaultSettings();

  const iban = String(
    map.bankIban || process.env.BANK_IBAN || defaults.bankIban || DEMO_BANK_CREDENTIALS.iban || ''
  ).trim();
  const swift = String(
    map.bankSwift || process.env.BANK_SWIFT || defaults.bankSwift || DEMO_BANK_CREDENTIALS.swift || ''
  ).trim();
  const bankName = String(
    map.bankName || process.env.BANK_NAME || defaults.bankName || DEMO_BANK_CREDENTIALS.bankName || ''
  ).trim();
  const accountName = String(
    map.bankAccountName ||
      process.env.BANK_ACCOUNT_NAME ||
      defaults.bankAccountName ||
      DEMO_BANK_CREDENTIALS.accountName ||
      ''
  ).trim();

  if (!iban || !swift) {
    throw new Error(
      'BANK_IBAN and BANK_SWIFT must be configured in Admin settings or environment.'
    );
  }

  return { iban, swift, bankName, accountName };
};

/**
 * Validation au démarrage (server.js).
 * Ne JAMAIS crasher le boot : soft-launch seed les coordonnées BO si absentes.
 */
export const validatePaymentEnvAtStartup = async () => {
  await ensureBankSettingsSeeded();

  const missing = [];

  try {
    await getBankCredentials();
  } catch {
    missing.push('BANK_IBAN', 'BANK_SWIFT');
  }

  if (!process.env.CMI_STORE_KEY?.trim() || process.env.CMI_STORE_KEY === 'your_cmi_store_key') {
    missing.push('CMI_STORE_KEY');
  }

  if (missing.length === 0) {
    logger.info('[paymentEnv] Payment credentials OK (values not logged)');
    return { ok: true, missing: [] };
  }

  const soft = missing.filter((k) => k === 'CMI_STORE_KEY');
  if (soft.length === missing.length) {
    logger.warn(
      `[paymentEnv] Optional missing: ${missing.join(', ')} — CMI disabled until configured; bank transfer OK via Settings.`
    );
    return { ok: true, missing };
  }

  const message = `[paymentEnv] Missing payment config: ${missing.join(', ')} — some payment endpoints return 503 until configured (app boot continues).`;
  logger.warn(message);
  return { ok: false, missing };
};

export default {
  getCmiStoreKey,
  getBankCredentials,
  ensureBankSettingsSeeded,
  validatePaymentEnvAtStartup,
  DEMO_BANK_CREDENTIALS,
};
