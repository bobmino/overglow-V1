import Product from '../models/productModel.js';
import Review from '../models/reviewModel.js';
import Schedule from '../models/scheduleModel.js';
import { popularDestinations, activityCategories, popularActivities } from '../data/popularDestinations.js';

// @desc    Get autocomplete suggestions
// @route   GET /api/search/autocomplete?q=query
// @access  Public
export const getAutocomplete = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ cities: [], activities: [] });
    }

    const searchRegex = new RegExp(q, 'i');

    // Search in products
    const products = await Product.find({
      status: 'Published',
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
        title: p.title,
        city: p.city,
        category: p.category
      }));

    res.json({
      cities: allCities,
      activities,
      showNearby: true
    });
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ message: 'Failed to fetch suggestions' });
  }
};

// @desc    Get all categories with product counts
// @route   GET /api/search/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categoryCounts = await Product.aggregate([
      { $match: { status: 'Published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      categories: activityCategories,
      popularActivities,
      counts: categoryCounts
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
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
      sortBy = 'recommended',
      page = 1,
      limit = 20
    } = req.query;

    // Build base query
    let query = { status: 'Published' };

    // Keyword search (title, description, highlights)
    if (q) {
      const keywordRegex = new RegExp(q, 'i');
      query.$or = [
        { title: keywordRegex },
        { description: keywordRegex },
        { highlights: { $in: [keywordRegex] } }
      ];
    }

    // City filter
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    // Category filter
    if (category) {
      query.category = category;
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

    // Execute base query
    let products = await Product.find(query)
      .populate('operator', 'companyName status')
      .lean();

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
    res.status(500).json({ message: 'Failed to perform search', error: error.message });
  }
};
