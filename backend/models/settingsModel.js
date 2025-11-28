import mongoose from 'mongoose';

const settingsSchema = mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  description: {
    type: String,
  },
}, {
  timestamps: true,
});

// Predefined settings keys
settingsSchema.statics.getDefaultSettings = () => ({
  autoApproveProducts: false, // Auto-approve products from approved operators
  autoApproveReviews: false, // Auto-approve reviews from approved users
  requireProductApproval: true, // Require admin approval for products
  requireReviewApproval: true, // Require admin approval for reviews
});

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;

