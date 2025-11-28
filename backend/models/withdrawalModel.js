import mongoose from 'mongoose';

const withdrawalSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Operator',
  },
  type: {
    type: String,
    enum: ['operator_payout', 'client_refund'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'EUR',
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Processed'],
    default: 'Pending',
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'paypal', 'stripe'],
  },
  paymentDetails: {
    accountNumber: String,
    bankName: String,
    paypalEmail: String,
    stripeAccountId: String,
  },
  reason: {
    type: String,
  },
  rejectionReason: {
    type: String,
  },
  processedAt: {
    type: Date,
  },
  relatedBookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  }],
}, {
  timestamps: true,
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

export default Withdrawal;

