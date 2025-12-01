import mongoose from 'mongoose';

const badgeSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['operator', 'product'],
    required: true,
  },
  icon: {
    type: String, // Emoji or icon name
    default: '🏆',
  },
  color: {
    type: String,
    default: '#059669', // Primary green
  },
  description: {
    type: String,
    required: true,
  },
  criteria: {
    // Criteria for earning this badge
    minRating: { type: Number, min: 0, max: 5 },
    minReviews: { type: Number, default: 0 },
    minBookings: { type: Number, default: 0 },
    minRevenue: { type: Number, default: 0 },
    maxResponseTime: { type: Number }, // Hours
    minCompletionRate: { type: Number, min: 0, max: 100 },
    isVerified: { type: Boolean },
    isLocal: { type: Boolean },
    minViewCount: { type: Number, default: 0 },
    minBookingCount: { type: Number, default: 0 },
    isNew: { type: Boolean }, // Product created in last 30 days
    isBestValue: { type: Boolean }, // Price below average for category
    isLastMinute: { type: Boolean }, // Available within 24h
  },
  isAutomatic: {
    type: Boolean,
    default: true, // Badge is automatically assigned when criteria are met
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const Badge = mongoose.model('Badge', badgeSchema);

export default Badge;
