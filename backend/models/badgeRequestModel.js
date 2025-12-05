import mongoose from 'mongoose';

const badgeRequestSchema = mongoose.Schema({
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Operator',
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  },
  badge: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Badge',
  },
  requestedFlags: {
    // Les flags d'authenticité demandés pour ce badge
    isArtisan: { type: Boolean, default: false },
    isEcoFriendly: { type: Boolean, default: false },
    isTraditional: { type: Boolean, default: false },
    isAuthenticLocal: { type: Boolean, default: false },
    isLocal100: { type: Boolean, default: false },
  },
  justification: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  evidence: {
    // Preuves/photos pour justifier la demande
    photos: [{ type: String }],
    documents: [{ type: String }],
    links: [{ type: String }],
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  rejectionReason: {
    type: String,
  },
  adminNotes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index pour éviter les doublons (un opérateur ne peut pas demander le même badge pour le même produit deux fois)
badgeRequestSchema.index({ product: 1, badge: 1 }, { unique: true });

// Index pour les requêtes admin
badgeRequestSchema.index({ status: 1, createdAt: -1 });

const BadgeRequest = mongoose.model('BadgeRequest', badgeRequestSchema);

export default BadgeRequest;

