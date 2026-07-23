import Taxonomy from '../models/taxonomyModel.js';
import { logger } from '../utils/logger.js';

const labelFor = (node, lang = 'fr') => {
  const l = node.label || {};
  return l[lang] || l.fr || node.slug;
};

/**
 * @desc    Arbre taxonomie (parents + children)
 * @route   GET /api/taxonomy?productType=tour&lang=fr
 * @access  Public
 */
export const getTaxonomyTree = async (req, res) => {
  try {
    const { productType, lang = 'fr' } = req.query;
    const filter = { isActive: true, kind: 'parent', parent: null };
    if (productType && ['tour', 'luxury_stay', 'service'].includes(productType)) {
      filter.productTypes = productType;
    }

    const parents = await Taxonomy.find(filter).sort({ order: 1 }).lean();
    const parentIds = parents.map((p) => p._id);
    const children = await Taxonomy.find({
      isActive: true,
      kind: 'leaf',
      parent: { $in: parentIds },
    })
      .sort({ order: 1 })
      .lean();

    const byParent = new Map();
    children.forEach((c) => {
      const key = String(c.parent);
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push({
        _id: c._id,
        slug: c.slug,
        label: labelFor(c, lang),
        labels: c.label,
        productTypes: c.productTypes,
        kind: c.kind,
      });
    });

    const tree = parents.map((p) => ({
      _id: p._id,
      slug: p.slug,
      label: labelFor(p, lang),
      labels: p.label,
      productTypes: p.productTypes,
      kind: p.kind,
      children: byParent.get(String(p._id)) || [],
    }));

    res.json({ tree, lang });
  } catch (error) {
    logger.error('getTaxonomyTree error:', error);
    res.status(500).json({ message: 'Failed to load taxonomy' });
  }
};

/**
 * @desc    Recherche feuilles (search-as-you-type)
 * @route   GET /api/taxonomy/search?q=&productType=&lang=fr
 * @access  Public
 */
export const searchTaxonomy = async (req, res) => {
  try {
    const { q = '', productType, lang = 'fr', parent } = req.query;
    const filter = { isActive: true, kind: 'leaf' };
    if (productType && ['tour', 'luxury_stay', 'service'].includes(productType)) {
      filter.productTypes = productType;
    }
    if (parent) {
      filter.parent = parent;
    }

    const term = String(q).trim();
    if (term) {
      const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { slug: rx },
        { 'label.fr': rx },
        { 'label.en': rx },
        { 'label.es': rx },
        { 'label.ar': rx },
      ];
    }

    const leaves = await Taxonomy.find(filter)
      .populate('parent', 'slug label')
      .sort({ order: 1 })
      .limit(40)
      .lean();

    res.json({
      results: leaves.map((c) => ({
        _id: c._id,
        slug: c.slug,
        label: labelFor(c, lang),
        labels: c.label,
        productTypes: c.productTypes,
        parent: c.parent
          ? {
              _id: c.parent._id,
              slug: c.parent.slug,
              label: labelFor(c.parent, lang),
            }
          : null,
      })),
    });
  } catch (error) {
    logger.error('searchTaxonomy error:', error);
    res.status(500).json({ message: 'Failed to search taxonomy' });
  }
};

/**
 * Résout des IDs taxonomie → labels FR (pour category dérivée).
 */
export const resolveTaxonomyLabels = async (ids = []) => {
  if (!ids?.length) return [];
  const nodes = await Taxonomy.find({ _id: { $in: ids }, isActive: true }).lean();
  return nodes.map((n) => labelFor(n, 'fr'));
};

export default { getTaxonomyTree, searchTaxonomy, resolveTaxonomyLabels };
