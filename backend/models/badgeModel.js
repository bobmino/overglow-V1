import mongoose from 'mongoose';

const badgeSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
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
    isLocal100: { type: Boolean },
    isArtisan: { type: Boolean },
    isAuthenticLocal: { type: Boolean },
    isEcoFriendly: { type: Boolean },
    isTraditional: { type: Boolean },
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

// Create compound unique index on name + type to allow same name for different types
badgeSchema.index({ name: 1, type: 1 }, { unique: true });

const Badge = mongoose.model('Badge', badgeSchema);

// Remove old unique index on name only if it exists (migration helper)
Badge.collection.dropIndex('name_1').catch(() => {
  // Index doesn't exist, ignore error
});

export default Badge;
