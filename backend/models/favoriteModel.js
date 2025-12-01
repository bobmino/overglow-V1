import mongoose from 'mongoose';

const favoriteSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  },
  listName: {
    type: String,
    default: 'default', // 'default', 'wishlist', 'bookmarked', or custom list name
  },
  notes: {
    type: String, // Personal notes about this favorite
  },
  // Sharing
  isPublic: {
    type: Boolean,
    default: false,
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true, // Only required if isPublic is true
  },
  // Price tracking
  priceWhenAdded: {
    type: Number, // Track price when added to favorites
  },
}, {
  timestamps: true,
});

// Compound index to prevent duplicates
favoriteSchema.index({ user: 1, product: 1, listName: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;

