import mongoose from 'mongoose';
import Booking from '../models/bookingModel.js';
import Product from '../models/productModel.js';
import CategoryGroup from '../models/categoryGroupModel.js';
import Badge from '../models/badgeModel.js';
import { clearCache } from '../middleware/cacheMiddleware.js';
import connectDB from '../../config/db.js';
import { localizeProducts, resolveRequestLang, normalizeLang } from '../utils/contentI18n.js';
import { logger } from '../utils/logger.js';

const localizeGroupName = (group, lang) => {
  const locale = normalizeLang(lang);
  const i18n = group.nameI18n || {};
  return i18n[locale] || i18n.fr || group.name;
};

const ensureDbConnected = async () => {
  if (mongoose.connection?.readyState === 1) return;
  logger.info('[Homepage] Database not connected. Attempting connection...');
  try {
    await connectDB();
  } catch (err) {
    logger.error('[Homepage] Failed to connect to database:', err);
  }
};

const EMPTY_LAYOUT = {
  topDestinations: [],
  offers: { national: [], international: [], insolite: [] },
  topCircuits: [],
  topServices: [],
  topProducts: [],
};

// Lightweight projection — only the fields the frontend actually needs
const CARD_PROJECTION = {
  title: 1,
  slug: 1,
  city: 1,
  price: 1,
  duration: 1,
  images: { $slice: 1 }, // only first image for card thumbnail
  'metrics.averageRating': 1,
  'metrics.reviewCount': 1,
  'metrics.bookingCount': 1,
  tags: 1,
  badges: 1,
  categoryGroup: 1,
  category: 1,
  productType: 1,
  i18n: 1,
};

// @desc    Get dynamic homepage layout data (zero hardcoding)
// @route   GET /api/homepage/layout
// @access  Public
export const getHomepageLayout = async (req, res) => {
  const startTime = Date.now();
  try {
    await ensureDbConnected();
    if (mongoose.connection?.readyState !== 1) {
      return res.status(200).json({
        success: true,
        degraded: true,
        performance: { responseTimeMs: Date.now() - startTime, cached: false },
        layout: EMPTY_LAYOUT,
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // SINGLE parallel batch — every DB round-trip happens here
    // ═══════════════════════════════════════════════════════════════════
    const [
      rawTopDestinations,
      productFallbackDestinations,
      activeCategoryGroups,
      taggedProducts,
      allBadges,
    ] = await Promise.all([
      // ── 1. Top Destinations (from confirmed bookings) ──
      Booking.aggregate([
        { $match: { status: 'Confirmed' } },
        {
          $lookup: {
            from: 'schedules',
            localField: 'schedule',
            foreignField: '_id',
            as: 'scheduleData',
            pipeline: [{ $project: { product: 1 } }], // only fetch product ref
          },
        },
        { $unwind: '$scheduleData' },
        {
          $lookup: {
            from: 'products',
            localField: 'scheduleData.product',
            foreignField: '_id',
            as: 'productData',
            pipeline: [{ $project: { city: 1, images: { $slice: ['$images', 1] } } }],
          },
        },
        { $unwind: '$productData' },
        {
          $group: {
            _id: '$productData.city',
            bookingCount: { $sum: 1 },
            image: { $first: { $arrayElemAt: ['$productData.images', 0] } },
          },
        },
        { $sort: { bookingCount: -1 } },
        { $limit: 8 },
        {
          $project: {
            city: '$_id',
            bookingCount: 1,
            image: {
              $ifNull: [
                '$image',
                'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=600&q=80',
              ],
            },
            _id: 0,
          },
        },
      ]),

      // ── 2. Fallback destinations (always run — cost is negligible if unused) ──
      Product.aggregate([
        { $match: { status: 'Published' } },
        {
          $group: {
            _id: '$city',
            bookingCount: { $max: { $ifNull: ['$metrics.bookingCount', 0] } },
            image: { $first: { $arrayElemAt: ['$images', 0] } },
          },
        },
        { $sort: { bookingCount: -1 } },
        { $limit: 8 },
        {
          $project: {
            city: '$_id',
            bookingCount: 1,
            image: {
              $ifNull: [
                '$image',
                'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=600&q=80',
              ],
            },
            _id: 0,
          },
        },
      ]),

      // ── 3. Active Category Groups ──
      CategoryGroup.find({ isActive: true }).sort({ order: 1 }).lean(),

      // ── 4. ALL tagged + category products in ONE query ──
      // Uses the compound index { status: 1, tags: 1 }
      // We pull all products that have ANY relevant tag OR belong to any active group.
      // This replaces 4 separate queries (topCircuits, topServices, topProducts, categoryProducts).
      Product.find({
        status: 'Published',
        $or: [
          { tags: { $in: ['Top Circuit', 'Top Service', 'Top Produit'] } },
          { categoryGroup: { $exists: true, $ne: null } },
        ],
      })
        .select(CARD_PROJECTION)
        .sort({ 'metrics.averageRating': -1, 'metrics.bookingCount': -1 })
        .lean(),

      // ── 5. All badges in one shot (tiny collection) ──
      Badge.find({}).lean(),
    ]);

    // ═══════════════════════════════════════════════════════════════════
    // IN-MEMORY post-processing (fast — no I/O)
    // ═══════════════════════════════════════════════════════════════════

    // Build badge lookup map
    const badgeMap = new Map();
    for (const badge of allBadges) {
      badgeMap.set(badge._id.toString(), badge);
    }

    // Hydrate badges on tagged products in place
    for (const product of taggedProducts) {
      if (product.badges && product.badges.length > 0) {
        product.badges = product.badges.map((b) => ({
          ...b,
          badgeId: badgeMap.get(b.badgeId?.toString()) || b.badgeId,
        }));
      }
    }

    // Partition tagged products by tag
    const topCircuits = [];
    const topServices = [];
    const topProducts = [];
    const tagSets = { 'Top Circuit': topCircuits, 'Top Service': topServices, 'Top Produit': topProducts };

    for (const product of taggedProducts) {
      if (product.tags) {
        for (const tag of product.tags) {
          const arr = tagSets[tag];
          if (arr && arr.length < 8) {
            arr.push(product);
          }
        }
      }
    }

    // Destinations — use booking-based if sufficient, otherwise fallback
    const destinations =
      rawTopDestinations && rawTopDestinations.length >= 4
        ? rawTopDestinations
        : productFallbackDestinations;

    // Distribute products to category groups
    const nationalGroups = [];
    const internationalGroups = [];
    const insoliteGroups = [];

    for (const group of activeCategoryGroups) {
      const gid = group._id.toString();
      const groupWithProducts = {
        ...group,
        products: [],
      };

      // Collect products for this group (already sorted by rating/bookings)
      for (const p of taggedProducts) {
        if (groupWithProducts.products.length >= 8) break;
        if (p.categoryGroup && p.categoryGroup.toString() === gid) {
          groupWithProducts.products.push(p);
        }
      }

      if (group.type === 'National') {
        nationalGroups.push(groupWithProducts);
      } else if (group.type === 'International') {
        internationalGroups.push(groupWithProducts);
      } else if (group.type === 'Insolite') {
        insoliteGroups.push(groupWithProducts);
      }
    }

    const responseTime = Date.now() - startTime;
    const lang = resolveRequestLang(req);

    const localizeGroup = (group) => ({
      ...group,
      name: localizeGroupName(group, lang),
      displayName: localizeGroupName(group, lang),
      products: localizeProducts(group.products || [], lang),
    });

    res.json({
      success: true,
      lang,
      performance: {
        responseTimeMs: responseTime,
        cached: false,
      },
      layout: {
        topDestinations: destinations,
        offers: {
          national: nationalGroups.map(localizeGroup),
          international: internationalGroups.map(localizeGroup),
          insolite: insoliteGroups.map(localizeGroup),
        },
        topCircuits: localizeProducts(topCircuits.slice(0, 6), lang),
        topServices: localizeProducts(topServices.slice(0, 6), lang),
        topProducts: localizeProducts(topProducts.slice(0, 8), lang),
      },
    });
  } catch (error) {
    logger.error('[Homepage] Layout generation error:', error);
    res.status(200).json({
      success: true,
      degraded: true,
      message: "Erreur lors de la génération du layout de la page d'accueil",
      performance: { responseTimeMs: Date.now() - startTime, cached: false },
      layout: EMPTY_LAYOUT,
    });
  }
};

// ═══════════════════════════════════════════════════════════════════
// Cache invalidation — call this when products/bookings/categories change
// ═══════════════════════════════════════════════════════════════════
export const invalidateHomepageCache = () => {
  clearCache('/api/homepage');
};
