import mongoose from 'mongoose';

const blogSchema = mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères'],
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  excerpt: {
    type: String,
    required: [true, 'Le résumé est requis'],
    maxlength: [300, 'Le résumé ne peut pas dépasser 300 caractères'],
  },
  content: {
    type: String,
    required: [true, 'Le contenu est requis'],
  },
  featuredImage: {
    type: String,
    default: '',
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Destinations',
      'Conseils de voyage',
      'Culture',
      'Gastronomie',
      'Aventures',
      'Actualités',
      'Guides pratiques',
    ],
  },
  tags: [{
    type: String,
    trim: true,
  }],
  metaTitle: {
    type: String,
    maxlength: [60, 'Le meta titre ne peut pas dépasser 60 caractères'],
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'La meta description ne peut pas dépasser 160 caractères'],
  },
  keywords: [{
    type: String,
    trim: true,
  }],
  isPublished: {
    type: Boolean,
    default: false,
  },
  publishedAt: {
    type: Date,
  },
  views: {
    type: Number,
    default: 0,
  },
  readingTime: {
    type: Number, // in minutes
    default: 5,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  relatedDestinations: [{
    type: String, // City names
  }],
  seoScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
}, {
  timestamps: true,
});

// Indexes for performance
blogSchema.index({ slug: 1 });
blogSchema.index({ isPublished: 1, publishedAt: -1 });
blogSchema.index({ category: 1, isPublished: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ featured: 1, isPublished: 1 });
blogSchema.index({ title: 'text', content: 'text', tags: 'text' }); // Text search

// Pre-save middleware to generate slug and calculate reading time
blogSchema.pre('save', function(next) {
  // Generate slug from title if not provided
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Calculate reading time (average 200 words per minute)
  if (this.content) {
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }

  // Set publishedAt when publishing
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Generate meta title and description if not provided
  if (!this.metaTitle && this.title) {
    this.metaTitle = this.title.substring(0, 60);
  }
  if (!this.metaDescription && this.excerpt) {
    this.metaDescription = this.excerpt.substring(0, 160);
  }

  next();
});

// Method to increment views
blogSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
};

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;

