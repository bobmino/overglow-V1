import Product from '../models/productModel.js';
import Review from '../models/reviewModel.js';
import Schedule from '../models/scheduleModel.js';
import { popularDestinations, activityCategories, popularActivities } from '../data/popularDestinations.js';
import { logger } from '../utils/logger.js';
import {
  escapeRegex,
  normalizeCategory,
  matchesDurationFilter,
  parseFilterParams,
  buildPublishedProductQuery,
  buildSortOption,
} from '../services/productFilterService.js';
import { localizeProducts, resolveRequestLang } from '../utils/contentI18n.js';

// @desc    Get autocomplete suggestions
// @route   GET /api/search/autocomplete?q=query
// @access  Public
export const getAutocomplete = async (req, res) => {
  try {
    const q = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
    
    if (!q || q.length < 2) {
      return res.json({ cities: [], activities: [], showNearby: true });
    }

    const searchRegex = new RegExp(escapeRegex(q), 'i');

    const [matchedCities, products] = await Promise.all([
      Product.distinct('city', {
        status: { $regex: /^published$/i },
        city: searchRegex,
      }),
      Product.find({
        status: { $regex: /^published$/i },
        title: searchRegex,
      })
        .select('city title category')
        .limit(8)
        .lean(),
    ]);

    const matchingDestinations = popularDestinations
      .filter(
        (dest) =>
          dest.city.toLowerCase().includes(q.toLowerCase()) ||
          dest.country.toLowerCase().includes(q.toLowerCase())
      )
      .slice(0, 8);

    const cityMap = new Map();
    matchingDestinations.forEach((d) => {
      if (d.city) cityMap.set(d.city.toLowerCase(), { name: d.city, country: d.country || '' });
    });
    matchedCities.forEach((c) => {
      if (c && !cityMap.has(String(c).toLowerCase())) {
        cityMap.set(String(c).toLowerCase(), { name: c, country: '' });
      }
    });

    const allCities = Array.from(cityMap.values()).slice(0, 15);

    const activities = products.slice(0, 8).map((p) => ({
      id: p._id,
      slug: p?.slug || null,
      title: p?.title || '',
      city: p?.city || '',
      category: p?.category || '',
    }));

    res.json({
      cities: allCities,
      activities,
      showNearby: true,
    });
  } catch (error) {
    logger.error('Autocomplete error:', error);
    return res.json({ cities: [], activities: [], showNearby: true });
  }
};

// @desc    Get all categories with product counts
// @route   GET /api/search/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    let categoryCounts = [];
    try {
      categoryCounts = await Product.aggregate([
      { $match: { status: { $regex: /^published$/i } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    } catch (aggregateError) {
      logger.error('Get categories aggregate error:', aggregateError);
      categoryCounts = [];
    }

    let dynamicCategories = categoryCounts
      .map(item => item?._id)
      .filter(Boolean);

    // Fallback intelligent: extract from imported products if aggregate returned nothing
    if (!dynamicCategories.length) {
      try {
        dynamicCategories = (await Product.distinct('category', {
          status: { $regex: /^published$/i },
        })).filter(Boolean);
      } catch (distinctError) {
        logger.error('Get categories distinct fallback error:', distinctError);
        dynamicCategories = [];
      }
    }

    res.json({
      categories: dynamicCategories.length ? dynamicCategories : (Array.isArray(activityCategories) ? activityCategories : []),
      popularActivities,
      counts: categoryCounts
    });
  } catch (error) {
    logger.error('Get categories error:', error);
    return res.json({
      categories: [],
      popularActivities: Array.isArray(popularActivities) ? popularActivities : [],
      counts: [],
    });
  }
};

// @desc    Get popular destinations
// @route   GET /api/search/destinations
// @access  Public
export const getPopularDestinations = async (req, res) => {
  try {
    // Group by region
    const byRegion = popularDestinations.reduce((acc, dest) => {
      if (!acc[dest.region]) {
        acc[dest.region] = [];
      }
      acc[dest.region].push(dest);
      return acc;
    }, {});

    res.json({
      destinations: popularDestinations,
      byRegion
    });
  } catch (error) {
    logger.error('Get destinations error:', error);
    res.status(500).json({ message: 'Failed to fetch destinations' });
  }
};

// Helper kept for rating enrichment when metrics missing
const getProductRating = async (productId) => {
  try {
    const result = await Review.aggregate([
      { $match: { product: productId, status: 'Approved' } },
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]);
    return result[0]?.avg || 0;
  } catch {
    return 0;
  }
};

// @desc    Advanced search with robust server-side filters (no hardcoded city)
// @route   GET /api/search/advanced
// @access  Public
export const advancedSearch = async (req, res) => {
  try {
    const filters = parseFilterParams(req.query);
    const mongoQuery = buildPublishedProductQuery(filters);
    const sort = buildSortOption(filters.sortBy);

    let products = [];
    try {
      // $near cannot mix with some sorts — drop geo sort conflicts by fetching then sorting in memory if needed
      const hasGeo = Boolean(mongoQuery.$and?.some((c) => c.location));
      products = await Product.find(mongoQuery)
        .select('title images city category price duration operator badges skipTheLine metrics tags createdAt authenticity cancellationPolicy')
        .populate('operator', 'companyName status isClaimed')
        .populate('badges.badgeId', 'name icon color')
        .sort(hasGeo ? undefined : sort)
        .lean();
    } catch (mongoError) {
      logger.error('Advanced search mongo error:', mongoError);
      return res.json({
        products: [],
        total: 0,
        page: filters.page,
        limit: filters.limit,
        totalPages: 0,
        facets: { cities: [], categories: [], tags: [], priceRange: { min: 0, max: 0 } },
      });
    }

    let filteredProducts = products;

    // Duration still parsed from free-text field
    if (filters.durations.length > 0) {
      filteredProducts = filteredProducts.filter((product) =>
        matchesDurationFilter(product.duration, filters.durations)
      );
    }

    // Date availability via schedules
    if (filters.selectedDate) {
      const dayStart = new Date(filters.selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(filters.selectedDate);
      dayEnd.setHours(23, 59, 59, 999);

      const schedules = await Schedule.find({
        product: { $in: filteredProducts.map((p) => p._id) },
        date: { $gte: dayStart, $lte: dayEnd },
        capacity: { $gt: 0 },
      }).select('product');

      const availableIds = new Set(schedules.map((s) => s.product.toString()));
      filteredProducts = filteredProducts.filter((p) => availableIds.has(p._id.toString()));
    }

    // Enrich ratings from metrics (fallback to reviews if needed)
    const enriched = await Promise.all(
      filteredProducts.map(async (product) => {
        let averageRating = product.metrics?.averageRating ?? 0;
        let reviewCount = product.metrics?.reviewCount ?? 0;
        if (!averageRating && !reviewCount) {
          averageRating = await getProductRating(product._id);
          reviewCount = await Review.countDocuments({ product: product._id, status: 'Approved' });
        }
        return {
          ...product,
          averageRating,
          reviewCount,
          rating: averageRating,
        };
      })
    );

    // In-memory sort when geo query prevented Mongo sort
    const sorted = [...enriched];
    switch (filters.sortBy) {
      case 'price-low':
        sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case 'price-high':
        sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case 'rating':
        sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'popularity':
        sorted.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
      default:
        break;
    }

    const total = sorted.length;
    const startIndex = (filters.page - 1) * filters.limit;
    const paginatedProducts = sorted.slice(startIndex, startIndex + filters.limit);
    const lang = resolveRequestLang(req);

    // Facets from current result set (pre-pagination) for UI chips
    const cityMap = new Map();
    const categoryMap = new Map();
    const tagMap = new Map();
    let priceMin = Infinity;
    let priceMax = 0;
    for (const p of sorted) {
      if (p.city) cityMap.set(p.city, (cityMap.get(p.city) || 0) + 1);
      if (p.category) categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1);
      (p.tags || []).forEach((tag) => tagMap.set(tag, (tagMap.get(tag) || 0) + 1));
      const price = Number(p.price);
      if (Number.isFinite(price)) {
        priceMin = Math.min(priceMin, price);
        priceMax = Math.max(priceMax, price);
      }
    }

    res.json({
      products: localizeProducts(paginatedProducts, lang),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit) || 0,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit) || 0,
      },
      facets: {
        cities: [...cityMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        categories: [...categoryMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        tags: [...tagMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        priceRange: {
          min: priceMin === Infinity ? 0 : priceMin,
          max: priceMax,
        },
      },
      appliedFilters: filters,
      lang,
    });
  } catch (error) {
    logger.error('Advanced search error:', error);
    return res.json({
      products: [],
      total: 0,
      page: parseInt(req.query?.page || 1, 10),
      limit: parseInt(req.query?.limit || 20, 10),
      totalPages: 0,
      facets: { cities: [], categories: [], tags: [], priceRange: { min: 0, max: 0 } },
    });
  }
};

// @desc    Global facets for filter UI (all published catalogue)
// @route   GET /api/search/facets
// @access  Public
export const getSearchFacets = async (req, res) => {
  try {
    const match = { status: { $regex: /^published$/i } };

    const [cities, categories, tags, priceStats] = await Promise.all([
      Product.aggregate([
        { $match: match },
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $match: { _id: { $nin: [null, ''] } } },
        { $sort: { count: -1 } },
        { $limit: 50 },
      ]),
      Product.aggregate([
        { $match: match },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $match: { _id: { $nin: [null, ''] } } },
        { $sort: { count: -1 } },
      ]),
      Product.aggregate([
        { $match: match },
        { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 40 },
      ]),
      Product.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            min: { $min: '$price' },
            max: { $max: '$price' },
          },
        },
      ]),
    ]);

    res.json({
      cities: cities.map((c) => ({ name: c._id, count: c.count })),
      categories: categories.map((c) => ({ name: c._id, count: c.count })),
      tags: tags.map((t) => ({ name: t._id, count: t.count })),
      priceRange: {
        min: priceStats[0]?.min ?? 0,
        max: priceStats[0]?.max ?? 0,
      },
    });
  } catch (error) {
    logger.error('Get search facets error:', error);
    res.json({
      cities: [],
      categories: [],
      tags: [],
      priceRange: { min: 0, max: 0 },
    });
  }
};

// @desc    Get search suggestions (for dropdown autocomplete)
// @route   GET /api/search/suggestions?q=query
// @access  Public
export const getSearchSuggestions = async (req, res) => {
  try {
    const q = typeof req.query?.q === 'string' ? req.query.q.trim() : '';

    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const searchRegex = new RegExp(escapeRegex(q), 'i');

    const products = await Product.find({
      status: { $regex: /^published$/i },
      $or: [
        { city: searchRegex },
        { title: searchRegex },
        { category: searchRegex },
      ],
    })
      .select('city title category')
      .limit(20);

    const suggestions = [];

    products.forEach((p) => {
      if (p.city && p.city.toLowerCase().includes(q.toLowerCase())) {
        suggestions.push(p.city);
      }
      if (p.category && p.category.toLowerCase().includes(q.toLowerCase())) {
        suggestions.push(p.category);
      }
      if (p.title && p.title.toLowerCase().includes(q.toLowerCase())) {
        suggestions.push(p.title);
      }
    });

    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 5);

    res.json({
      suggestions: uniqueSuggestions,
    });
  } catch (error) {
    logger.error('Suggestions error:', error);
    return res.json({ suggestions: [] });
  }
};
