import mongoose from 'mongoose';

const bookingSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  schedule: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Schedule', // Optimisation : Utilisation de l'ID du créneau au lieu d'une chaîne de caractères
  },
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Operator',
  },
  numberOfTickets: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
    default: function () {
      return this.totalAmount;
    },
  },
  status: {
    type: String,
    enum: ['Pending', 'PENDING_PAYMENT', 'Confirmed', 'Cancelled'],
    default: 'Pending',
  },
  paymentIntentId: {
    type: String,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'cmi', 'cash_pickup', 'cash_delivery', 'bank_transfer'],
    default: 'stripe',
  },
  deliveryAddress: {
    type: String,
    default: '',
  },
  payoutStatus: {
    type: String,
    enum: ['pending', 'scheduled', 'completed'],
    default: 'pending',
  },
  payoutDate: {
    type: Date,
  },
  payoutEligibleDate: {
    type: Date,
  },
  internalNote: {
    type: String,
    default: '',
  },
  paymentReference: {
    type: String,
    // Format: OG-XXXXXXXX (8 derniers caractères de l'ID booking)
  },
  isHandled: {
    type: Boolean,
    default: false,
  },
  handledAt: {
    type: Date,
  },
  
  // Cancellation fields
  cancelledAt: {
    type: Date,
  },
  cancellationReason: {
    type: String,
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  refundStatus: {
    type: String,
    enum: ['Not Applicable', 'Pending', 'Processed', 'Rejected'],
    default: 'Not Applicable',
  },
}, {
  timestamps: true,
});

// Performance compound indexes for Sprint 1
bookingSchema.index({ status: 1, user: 1 });
bookingSchema.index({ status: 1, schedule: 1 });
bookingSchema.index({ status: 1, operator: 1 });
bookingSchema.index({ status: 1, paymentStatus: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
