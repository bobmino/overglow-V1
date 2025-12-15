import mongoose from 'mongoose';

const faqSchema = mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'La question est requise'],
      trim: true,
      maxlength: [500, 'La question ne peut pas dépasser 500 caractères'],
    },
    answer: {
      type: String,
      required: [true, 'La réponse est requise'],
      trim: true,
      maxlength: [5000, 'La réponse ne peut pas dépasser 5000 caractères'],
    },
    category: {
      type: String,
      required: [true, 'La catégorie est requise'],
      enum: [
        'general',
        'booking',
        'payment',
        'cancellation',
        'account',
        'operator',
        'products',
        'reviews',
        'technical',
        'safety',
      ],
      default: 'general',
    },
    subcategory: {
      type: String,
      trim: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    language: {
      type: String,
      enum: ['fr', 'ar', 'en', 'es'],
      default: 'fr',
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    helpful: {
      type: Number,
      default: 0,
    },
    notHelpful: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search and filtering
faqSchema.index({ category: 1, isActive: 1, language: 1 });
faqSchema.index({ question: 'text', answer: 'text' });
faqSchema.index({ tags: 1 });

const FAQ = mongoose.model('FAQ', faqSchema);

export default FAQ;

