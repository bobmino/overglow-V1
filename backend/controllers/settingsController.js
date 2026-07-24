import Settings from '../models/settingsModel.js';
import { logger } from '../utils/logger.js';

/** Keys safe to expose without auth (checkout / public UX). */
const PUBLIC_SETTING_KEYS = new Set([
  'maintenanceMode',
  'defaultLanguage',
  'defaultCurrency',
  'bankTransferEnabled',
  'stripeEnabled',
  'paypalEnabled',
  'cmiEnabled',
  'showIban',
]);

/** Keys readable by authenticated operators (Host cockpit). */
const OPERATOR_SETTING_KEYS = new Set([
  'platformCommissionPercent',
  'minWithdrawalAmountMad',
  'minWithdrawalDays',
  'transferFeeMad',
  'supportEmail',
]);

const canReadSetting = (key, user) => {
  if (PUBLIC_SETTING_KEYS.has(key)) return true;
  if (user?.role === 'Admin') return true;
  if (user?.role === 'Opérateur' && OPERATOR_SETTING_KEYS.has(key)) return true;
  return false;
};

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private/Admin
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.find({});
    const defaultSettings = Settings.getDefaultSettings();

    const mergedSettings = { ...defaultSettings };
    settings.forEach((s) => {
      mergedSettings[s.key] = s.value;
    });

    res.json(mergedSettings);
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
};

// @desc    Update a setting
// @route   PUT /api/settings/:key
// @access  Private/Admin
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    const setting = await Settings.findOneAndUpdate(
      { key },
      { value, description },
      { upsert: true, new: true }
    );

    res.json(setting);
  } catch (error) {
    logger.error('Update setting error:', error);
    res.status(500).json({ message: 'Failed to update setting' });
  }
};

// @desc    Get a specific setting value
// @route   GET /api/settings/:key
// @access  Public allowlist OR Operator allowlist OR Admin
const getSetting = async (req, res) => {
  try {
    const { key } = req.params;

    if (!canReadSetting(key, req.user)) {
      return res.status(403).json({ message: 'Setting non public' });
    }

    const setting = await Settings.findOne({ key });
    const defaultSettings = Settings.getDefaultSettings();

    res.json({
      key,
      value: setting ? setting.value : defaultSettings[key],
    });
  } catch (error) {
    logger.error('Get setting error:', error);
    res.status(500).json({ message: 'Failed to fetch setting' });
  }
};

export { getSettings, updateSetting, getSetting, PUBLIC_SETTING_KEYS, OPERATOR_SETTING_KEYS };
