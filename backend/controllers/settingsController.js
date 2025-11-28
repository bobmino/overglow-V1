import Settings from '../models/settingsModel.js';

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private/Admin
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.find({});
    const defaultSettings = Settings.getDefaultSettings();
    
    // Merge with defaults
    const mergedSettings = {};
    Object.keys(defaultSettings).forEach(key => {
      const setting = settings.find(s => s.key === key);
      mergedSettings[key] = setting ? setting.value : defaultSettings[key];
    });
    
    res.json(mergedSettings);
  } catch (error) {
    console.error('Get settings error:', error);
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
    console.error('Update setting error:', error);
    res.status(500).json({ message: 'Failed to update setting' });
  }
};

// @desc    Get a specific setting value
// @route   GET /api/settings/:key
// @access  Public (for checking auto-approval settings)
const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await Settings.findOne({ key });
    const defaultSettings = Settings.getDefaultSettings();
    
    res.json({ 
      key, 
      value: setting ? setting.value : defaultSettings[key] 
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ message: 'Failed to fetch setting' });
  }
};

export { getSettings, updateSetting, getSetting };

