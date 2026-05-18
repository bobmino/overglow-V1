import Product from '../models/productModel.js';
import Review from '../models/reviewModel.js';
import Schedule from '../models/scheduleModel.js';
import { popularDestinations, activityCategories, popularActivities } from '../data/popularDestinations.js';

// Category normalization mapping
const categoryNormalization = {
  // Slug variations -> Standard name
  'tours': 'Tours',
  'day-trips': 'Day Trips',
  'day trips': 'Day Trips',
  'daytrips': 'Day Trips',
  'outdoor': 'Outdoor Activities',
  'outdoor activities': 'Outdoor Activities',
  'outdooractivities': 'Outdoor Activities',
  'shows': 'Shows & Performances',
  'shows & performances': 'Shows & Performances',
  'showsandperformances': 'Shows & Performances',
  'food-drink': 'Food & Drink',
  'food & drink': 'Food & Drink',
  'foodanddrink': 'Food & Drink',
  'workshops': 'Classes & Workshops',
  'classes & workshops': 'Classes & Workshops',
  'classesandworkshops': 'Classes & Workshops',
  'activities': 'Activities',
  'attractions': 'Attractions',
};

// Normalize category name (handle variations and case-insensitive)
const normalizeCategory = (category) => {
  if (!category) return null;
  
  const lowerCategory = category.toLowerCase().trim();
  
  // Check exact match in normalization map
  if (categoryNormalization[lowerCategory]) {
    return categoryNormalization[lowerCategory];
  }
  
  // Check if it's already a standard name (case-insensitive)
  const standardNames = Object.values(categoryNormalization);
  for (const standardName of standardNames) {
    if (standardName.toLowerCase() === lowerCategory) {
      return standardName;
    }
  }
  
  // Return as-is if no normalization found
  return category;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

    // Search in products
    const products = await Product.find({
      status: { $regex: /^published$/i },
      $or: [
        { city: searchRegex },
        { title: searchRegex }
      ]
    })
    .select('city title category')
    .limit(10);

    // Extract unique cities from products
    const productCities = [...new Set(products.map(p => p.city))];

    // Search in popular destinations
    const matchingDestinations = popularDestinations.filter(dest =>
      dest.city.toLowerCase().includes(q.toLowerCase()) ||
      dest.country.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 5);

    // Combine and deduplicate cities
    const allCities = [...new Set([
      ...matchingDestinations.map(d => ({ name: d.city, country: d.country })),
      ...productCities.map(c => ({ name: c, country: '' }))
    ])].slice(0, 5);

    // Get matching activities
    const activities = products
      .filter(p => p.title.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 5)
      .map(p => ({
        id: p._id,
        slug: p?.slug || null,
        title: p?.title || '',
        city: p?.city || '',
        category: p?.category || ''
      }));

    res.json({
      cities: allCities,
      activities,
      showNearby: true
    });
  } catch (error) {
    console.error('Autocomplete error:', error);
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
      console.error('Get categories aggregate error:', aggregateError);
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
        console.error('Get categories distinct fallback error:', distinctError);
        dynamicCategories = [];
      }
    }

    res.json({
      categories: dynamicCategories.length ? dynamicCategories : (Array.isArray(activityCategories) ? activityCategories : []),
      popularActivities,
      counts: categoryCounts
    });
  } catch (error) {
    console.error('Get categories error:', error);
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
    console.error('Get destinations error:', error);
    res.status(500).json({ message: 'Failed to fetch destinations' });
  }
};

// Helper function to calculate average rating for a product
const getProductRating = async (productId) => {
  const reviews = await Review.find({ 
    product: productId, 
    status: 'Approved' 
  });
  
  if (reviews.length === 0) return 0;
  
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
};

// Helper function to parse duration string to hours
const parseDurationToHours = (durationStr) => {
  if (!durationStr) return null;
  
  const lower = durationStr.toLowerCase();
  
  // Handle "X heures" or "X hours"
  const hoursMatch = lower.match(/(\d+)\s*(?:heures?|hours?|h)/);
  if (hoursMatch) return parseInt(hoursMatch[1]);
  
  // Handle "X jours" or "X days"
  const daysMatch = lower.match(/(\d+)\s*(?:jours?|days?|j)/);
  if (daysMatch) return parseInt(daysMatch[1]) * 24;
  
  // Handle "X minutes" or "X min"
  const minutesMatch = lower.match(/(\d+)\s*(?:minutes?|mins?|m)/);
  if (minutesMatch) return parseInt(minutesMatch[1]) / 60;
  
  return null;
};

// Helper function to check if duration matches filter
const matchesDurationFilter = (durationStr, durationFilters) => {
  if (!durationFilters || durationFilters.length === 0) return true;
  if (!durationStr) return false;
  
  const hours = parseDurationToHours(durationStr);
  if (hours === null) return false;
  
  return durationFilters.some(filter => {
    switch (filter) {
      case '0-2':
        return hours < 2;
      case '2-4':
        return hours >= 2 && hours < 4;
      case '4-8':
        return hours >= 4 && hours < 8;
      case '1-day':
        return hours >= 8 && hours <= 24;
      case 'multi-day':
        return hours > 24;
      default:
        return true;
    }
  });
};

// @desc    Advanced search with filters
// @route   GET /api/search/advanced
// @access  Public
export const advancedSearch = async (req, res) => {
  try {
    const {
      q, // keywords
      city,
      category,
      minPrice,
      maxPrice,
      minRating,
      durations,
      selectedDate,
      locationLat,
      locationLng,
      radius, // in km
      skipTheLine, // Filter for skip-the-line products
      sortBy = 'recommended',
      page = 1,
      limit = 20
    } = req.query;

    // Build base query
    let query = { status: { $regex: /^published$/i } };

    // Keyword search (title, description, highlights, city, category)
    const normalizedQ = typeof q === 'string' ? q.trim() : '';
    if (normalizedQ) {
      const keywordRegex = escapeRegex(normalizedQ);
      query.$or = [
        { title: { $regex: keywordRegex, $options: 'i' } },
        { description: { $regex: keywordRegex, $options: 'i' } },
        { highlights: { $in: [new RegExp(keywordRegex, 'i')] } },
        { city: { $regex: keywordRegex, $options: 'i' } },
        { category: { $regex: keywordRegex, $options: 'i' } }
      ];
    }
    if (!normalizedQ && !city) {
      query.city = { $regex: /^agadir$/i };
    }

    // City filter
    if (city) {
      query.city = { $regex: escapeRegex(city), $options: 'i' };
    }

    // Category filter - normalize category name
    if (category) {
      const normalizedCategory = normalizeCategory(category);
      // Use case-insensitive regex to match variations
      query.category = { $regex: `^${escapeRegex(normalizedCategory)}$`, $options: 'i' };
    }

    // Skip-the-Line filter
    if (skipTheLine === 'true' || skipTheLine === true) {
      query['skipTheLine.enabled'] = true;
    }

    // Price filter - we'll filter after getting products with schedules
    // because price can be in product.price or schedule.price

    // Location-based search (geolocation)
    if (locationLat && locationLng && radius) {
      const lat = parseFloat(locationLat);
      const lng = parseFloat(locationLng);
      const radiusInMeters = parseFloat(radius) * 1000; // Convert km to meters
      
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat] // MongoDB uses [longitude, latitude]
          },
          $maxDistance: radiusInMeters
        }
      };
    }

    console.log('Mongoose Query Filter:', JSON.stringify(query));

    // Execute base query
    let products = [];
    try {
      products = await Product.find(query)
        .populate('operator', 'companyName status isClaimed')
        .lean();
    } catch (mongoError) {
      console.error('Advanced search mongo error:', mongoError);
      return res.json({
        products: [],
        total: 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: 0,
      });
    }

    // Apply filters that require additional processing
    let filteredProducts = products;

    // Price filter
    if (minPrice || maxPrice) {
      filteredProducts = filteredProducts.filter(product => {
        // Check product price
        const productPrice = Number(product.price) || 0;
        
        // Check schedule prices
        let minSchedulePrice = null;
        // We'll need to fetch schedules separately if needed
        
        const price = productPrice || minSchedulePrice || 0;
        const min = minPrice ? parseFloat(minPrice) : 0;
        const max = maxPrice ? parseFloat(maxPrice) : Infinity;
        
        return price >= min && price <= max;
      });
    }

    // Duration filter
    if (durations && Array.isArray(durations) && durations.length > 0) {
      filteredProducts = filteredProducts.filter(product => 
        matchesDurationFilter(product.duration, durations)
      );
    }

    // Rating filter - need to calculate ratings
    if (minRating) {
      const minRatingNum = parseFloat(minRating);
      const productsWithRatings = await Promise.all(
        filteredProducts.map(async (product) => {
          const rating = await getProductRating(product._id);
          return { product, rating };
        })
      );
      
      filteredProducts = productsWithRatings
        .filter(({ rating }) => rating >= minRatingNum)
        .map(({ product }) => product);
    }

    // Date filter - check if product has available schedules on selected date
    if (selectedDate) {
      const date = new Date(selectedDate);
      const schedules = await Schedule.find({
        product: { $in: filteredProducts.map(p => p._id) },
        date: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lt: new Date(date.setHours(23, 59, 59, 999))
        },
        capacity: { $gt: 0 } // Has available capacity
      }).select('product');
      
      const availableProductIds = [...new Set(schedules.map(s => s.product.toString()))];
      filteredProducts = filteredProducts.filter(p => 
        availableProductIds.includes(p._id.toString())
      );
    }

    // Add ratings to products for sorting
    const productsWithRatings = await Promise.all(
      filteredProducts.map(async (product) => {
        const rating = await getProductRating(product._id);
        const reviewCount = await Review.countDocuments({ 
          product: product._id, 
          status: 'Approved' 
        });
        return {
          ...product,
          averageRating: rating,
          reviewCount
        };
      })
    );

    // Sorting
    switch (sortBy) {
      case 'price-low':
        productsWithRatings.sort((a, b) => {
          const priceA = Number(a.price) || 0;
          const priceB = Number(b.price) || 0;
          return priceA - priceB;
        });
        break;
      case 'price-high':
        productsWithRatings.sort((a, b) => {
          const priceA = Number(a.price) || 0;
          const priceB = Number(b.price) || 0;
          return priceB - priceA;
        });
        break;
      case 'rating':
        productsWithRatings.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case 'popularity':
        productsWithRatings.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'recommended':
      default:
        // Keep original order (could be enhanced with ML recommendations)
        break;
    }

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedProducts = productsWithRatings.slice(startIndex, endIndex);

    res.json({
      products: paginatedProducts,
      total: productsWithRatings.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(productsWithRatings.length / parseInt(limit))
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    return res.json({
      products: [],
      total: 0,
      page: parseInt(req.query?.page || 1),
      limit: parseInt(req.query?.limit || 20),
      totalPages: 0,
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

    // Search in products
    const products = await Product.find({
      status: { $regex: /^published$/i },
      $or: [
        { city: searchRegex },
        { title: searchRegex },
        { category: searchRegex }
      ]
    })
    .select('city title category')
    .limit(20);

    const suggestions = [];

    // Add matching cities
    products.forEach(p => {
      if (p.city && p.city.toLowerCase().includes(q.toLowerCase())) {
        suggestions.push(p.city);
      }
    });

    // Add matching categories
    products.forEach(p => {
      if (p.category && p.category.toLowerCase().includes(q.toLowerCase())) {
        suggestions.push(p.category);
      }
    });

    // Add matching titles
    products.forEach(p => {
      if (p.title && p.title.toLowerCase().includes(q.toLowerCase())) {
        suggestions.push(p.title);
      }
    });

    // Deduplicate and limit to 5
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 5);

    res.json({
      suggestions: uniqueSuggestions
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    return res.json({ suggestions: [] });
  }
};
