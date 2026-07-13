import mongoose from 'mongoose';

const inquirySchema = mongoose.Schema({
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
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Operator',
  },
  type: {
    type: String,
    enum: ['manual', 'automatic'],
    required: true,
  },
  // For manual inquiries (Q&A)
  question: {
    type: String,
  },
  answer: {
    type: String,
  },
  answeredAt: {
    type: Date,
  },
  // For automatic inquiries (validation required)
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approvedAt: {
    type: Date,
  },
  rejectionReason: {
    type: String,
  },
  // Related booking (if inquiry is for a booking)
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
}, {
  timestamps: true,
});

// Sprint [8]: user/operator inquiry lists sorted by recency + status filtering
inquirySchema.index({ user: 1, createdAt: -1 });
inquirySchema.index({ operator: 1, createdAt: -1 });
inquirySchema.index({ operator: 1, status: 1 });
inquirySchema.index({ product: 1, status: 1 });
inquirySchema.index({ status: 1, createdAt: -1 });

const Inquiry = mongoose.model('Inquiry', inquirySchema);

export default Inquiry;

