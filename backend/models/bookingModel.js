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
    ref: 'Schedule',
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
    enum: ['Pending', 'Confirmed', 'Cancelled'],
    default: 'Pending',
  },
  paymentIntentId: {
    type: String,
  },
  internalNote: {
    type: String,
    default: '',
  },
  isHandled: {
    type: Boolean,
    default: false,
  },
  handledAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
