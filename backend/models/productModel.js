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
  slug: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple documents without a slug while enforcing uniqueness when set
    index: true, // Optimisation : Ajout d'un index pour les recherches par slug
  },
  description: {
    type: String,
    required: true,
  },
  /**
   * Optional per-language overrides. Root title/description remain the fallback (usually FR).
   * Shape: { en: { title, description, highlights, included, ... }, ar: {...}, es: {...} }
   */
  i18n: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  category: {
    type: String,
    required: true,
  },
  categoryGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategoryGroup',
    index: true, // Optimisation : Ajout d'un index pour les recherches par groupe de catégories
  },
  productType: {
    type: String,
    enum: ['tour', 'luxury_stay', 'service'],
    default: 'tour',
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
      index: '2dsphere', // Optimisation : Ajout d'un index géospatial pour les recherches par emplacement
    },
  },
  images: [{
    type: String,
  }],
  seo: {
    metaTitle: { type: String },
    metaDescription: { type: String },
    ogTitle: { type: String },
    ogDescription: { type: String },
    ogImage: { type: String },
  },
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
  
  // Skip-the-Line feature
  skipTheLine: {
    enabled: { type: Boolean, default: false },
    type: {
      type: String,
      enum: ['Fast Track', 'VIP', 'Early Access'],
      default: 'Fast Track',
    },
    additionalPrice: { type: Number, default: 0 }, // Additional price for skip-the-line
    description: { type: String, default: 'Évitez les files d\'attente avec cette option' },
    availability: {
      type: String,
      enum: ['always', 'limited', 'seasonal'],
      default: 'always',
    },
    maxCapacity: { type: Number, default: null }, // Max skip-the-line tickets per time slot
  },

  // Séjours Luxe
  luxuryStay: {
    rooms: { type: Number, default: 1 },
    capacity: { type: Number, default: 2 },
    amenities: {
      pool: { type: Boolean, default: false },
      wifi: { type: Boolean, default: false },
      jacuzzi: { type: Boolean, default: false },
      garden: { type: Boolean, default: false },
    },
    propertyType: {
      type: String,
      enum: ['villa', 'riad', 'apartment', 'suite', 'other', ''],
      default: '',
    },
    standing: {
      type: Number,
      enum: [1, 2, 3], // 1 to 3 stars luxury
      default: 1,
    },
  },

  // Services (Transport, Guide, etc.)
  serviceDetails: {
    vehicleType: { type: String, default: '' },
    vehicleCount: { type: Number, default: 1 },
    guideIncluded: { type: Boolean, default: false },
    languages: { type: [String], default: [] },
  },

  // Préférence de paiement
  paymentPreference: {
    type: String,
    enum: ['Paiement par virement bancaire', 'Paiement sur place'],
    default: 'Paiement sur place',
  },

  // Tags/segments d'authenticité
  authenticity: {
    isArtisan: { type: Boolean, default: false },
    isAuthenticLocal: { type: Boolean, default: false },
    isEcoFriendly: { type: Boolean, default: false },
    isTraditional: { type: Boolean, default: false },
    isLocal100: { type: Boolean, default: false },
  },
  
  // Tags explicites (ex: "Top Produit", "Top Circuit")
  tags: {
    type: [String],
    default: [],
    index: true, // Optimisation : Ajout d'un index pour les recherches par tags
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
      default: '',
    },
  },
}, {
  timestamps: true,
  strict: false,
});

// Performance compound indexes for Sprint 1
productSchema.index({ status: 1, productType: 1 });
productSchema.index({ status: 1, tags: 1 });
productSchema.index({ status: 1, categoryGroup: 1 });
productSchema.index({ status: 1, city: 1 });
productSchema.index({ status: 1, 'metrics.averageRating': -1 });
// Sprint [8]: sorting/filtering by recency and operator dashboards
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ operator: 1, status: 1, createdAt: -1 });

const Product = mongoose.model('Product', productSchema, 'products');

export default Product;
