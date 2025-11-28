import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Operator',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere',
    },
  },
  images: [{
    type: String,
  }],
  highlights: {
    type: [String],
    default: [],
  },
  included: {
    type: [String],
    default: [],
  },
  requirements: {
    type: [String],
    default: [],
  },
  requiresInquiry: {
    type: Boolean,
    default: false,
  },
  inquiryType: {
    type: String,
    enum: ['manual', 'automatic', 'none'],
    default: 'none',
  },
  timeSlots: {
    type: [{
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    }],
    default: [],
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending Review', 'Published'],
    default: 'Draft',
  },
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

export default Product;
