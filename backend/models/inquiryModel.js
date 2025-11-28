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

const Inquiry = mongoose.model('Inquiry', inquirySchema);

export default Inquiry;

