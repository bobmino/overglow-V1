import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Operator',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere',
    },
  },
  images: [{
    type: String,
  }],
  highlights: {
    type: [String],
    default: [],
  },
  included: {
    type: [String],
    default: [],
  },
  requirements: {
    type: [String],
    default: [],
  },
  requiresInquiry: {
    type: Boolean,
    default: false,
  },
  inquiryType: {
    type: String,
    enum: ['manual', 'automatic', 'none'],
    default: 'none',
  },
  timeSlots: {
    type: [{
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    }],
    default: [],
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending Review', 'Published'],
    default: 'Draft',
  },
  
  // Badges produits
  badges: [{
    badgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge',
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Métriques pour badges produits
  metrics: {
    viewCount: { type: Number, default: 0 },
    bookingCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isPopular: { type: Boolean, default: false },
    isBestValue: { type: Boolean, default: false },
    isNew: { type: Boolean, default: true },
    isLastMinute: { type: Boolean, default: false },
  },
  
  // Politique d'annulation
  cancellationPolicy: {
    type: {
      type: String,
      enum: ['free', 'moderate', 'strict', 'non_refundable'],
      default: 'moderate',
    },
    freeCancellationHours: {
      type: Number,
      default: 24, // Heures avant le début pour annulation gratuite
    },
    refundPercentage: {
      type: Number,
      default: 100, // Pourcentage de remboursement si annulation gratuite
    },
    description: {
      type: String,
      default: 'Annulation gratuite jusqu\'à 24h avant le début de l\'expérience',
    },
  },
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

export default Product;
