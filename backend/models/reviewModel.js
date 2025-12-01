import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  approvedAt: {
    type: Date,
  },
  rejectedAt: {
    type: Date,
  },
  rejectionReason: {
    type: String,
  },
  
  // Photos dans la review
  photos: [{
    type: String, // URLs des photos
  }],
  
  // Votes utiles
  helpfulVotes: {
    type: Number,
    default: 0,
  },
  
  // Utilisateurs qui ont voté "utile"
  helpfulVoters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  // Utilisateurs qui ont voté "pas utile"
  notHelpfulVoters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  // Review vérifiée (client a réservé)
  isVerified: {
    type: Boolean,
    default: false,
  },
  
  // Réponse de l'opérateur
  operatorResponse: {
    message: { type: String },
    respondedAt: { type: Date },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  
  // Signalements de review
  reports: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'fake', 'offensive', 'other'],
    },
    description: { type: String },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending',
    },
  }],
  reportCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
