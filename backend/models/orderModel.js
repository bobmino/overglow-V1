import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    image: {
      type: String,
      default: '',
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      // Format: OG-YYYY-XXXXXXXX
    },
    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, default: '', trim: true },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'La commande doit contenir au moins un article.',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
      default: 'confirmed',
    },
    paymentMethod: {
      type: String,
      enum: ['cash_pickup', 'cash_delivery', 'bank_transfer', 'card', 'on_site'],
      default: 'on_site',
    },
    notes: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      enum: ['cart_checkout', 'admin', 'api'],
      default: 'cart_checkout',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate orderId in format OG-YYYY-XXXXXXXX before save
orderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    const year = new Date().getFullYear();
    const suffix = this._id.toString().slice(-8).toUpperCase();
    this.orderId = `OG-${year}-${suffix}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
