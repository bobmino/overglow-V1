import mongoose from 'mongoose';

const scheduleSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  },
  date: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  time: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
  },
  capacity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'MAD',
  },
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  }],
}, {
  timestamps: true,
});

// Sprint [8]: availability lookups sorted by date/time for a given product
scheduleSchema.index({ product: 1, date: 1, time: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;
