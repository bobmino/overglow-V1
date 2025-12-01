import mongoose from 'mongoose';

const viewHistorySchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  viewedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
viewHistorySchema.index({ user: 1, viewedAt: -1 });
viewHistorySchema.index({ user: 1, product: 1 });

// Prevent duplicate views in same session (same user, same product, same day)
viewHistorySchema.index({ user: 1, product: 1, viewedAt: 1 }, { unique: false });

const ViewHistory = mongoose.model('ViewHistory', viewHistorySchema);

export default ViewHistory;

