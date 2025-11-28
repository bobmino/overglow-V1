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
}, {
  timestamps: true,
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
