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

/** [PROMPT-5] Platform settings defaults (any key can still be upserted). */
settingsSchema.statics.getDefaultSettings = () => ({
  // Général
  autoApproveProducts: false,
  autoApproveReviews: false,
  requireProductApproval: true,
  requireReviewApproval: true,
  maintenanceMode: false,
  defaultLanguage: 'fr',
  defaultCurrency: 'MAD',
  // Finances
  platformCommissionPercent: 15,
  minWithdrawalDays: 7,
  transferFeeMad: 0,
  minWithdrawalAmountMad: 100,
  // Paiements
  stripeEnabled: true,
  stripeTestMode: true,
  paypalEnabled: true,
  paypalTestMode: true,
  cmiEnabled: false,
  bankTransferEnabled: true,
  showIban: true,
  // Notifications
  supportEmail: 'support@overglow.online',
  notifyNewUser: true,
  notifyNewBooking: true,
  notifyPaymentReceived: true,
  notifyWithdrawalRequested: true,
  digestEmailFrequency: 'weekly',
});

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
