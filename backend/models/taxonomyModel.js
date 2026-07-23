import mongoose from 'mongoose';

/**
 * Taxonomie hiérarchique Overglow (pattern Viator).
 * parent=null → racine (Circuits, Activités, Transport…)
 * kind=leaf → sélectionnable en multi-select
 */
const taxonomySchema = mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    label: {
      fr: { type: String, required: true },
      en: { type: String, default: '' },
      es: { type: String, default: '' },
      ar: { type: String, default: '' },
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taxonomy',
      default: null,
      index: true,
    },
    /** Rayons catalogue concernés */
    productTypes: {
      type: [{ type: String, enum: ['tour', 'luxury_stay', 'service'] }],
      default: ['tour'],
      index: true,
    },
    kind: {
      type: String,
      enum: ['parent', 'leaf'],
      default: 'leaf',
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
  },
  { timestamps: true }
);

taxonomySchema.index({ productTypes: 1, parent: 1, order: 1 });

const Taxonomy = mongoose.model('Taxonomy', taxonomySchema);

export default Taxonomy;
