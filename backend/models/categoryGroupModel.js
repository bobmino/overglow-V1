import mongoose from 'mongoose';

const categoryGroupSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['National', 'International', 'Insolite'],
    required: true,
    index: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound index for retrieval ordering and status filtering
categoryGroupSchema.index({ isActive: 1, type: 1, order: 1 });

const CategoryGroup = mongoose.model('CategoryGroup', categoryGroupSchema);

export default CategoryGroup;
