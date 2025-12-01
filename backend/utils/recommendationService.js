import Product from '../models/productModel.js';
import Booking from '../models/bookingModel.js';
import Review from '../models/reviewModel.js';
import Favorite from '../models/favoriteModel.js';

/**
 * Get personalized product recommendations for a user
 * @param {String} userId - User ID
 * @param {Number} limit - Number of recommendations to return
 * @returns {Array} Recommended products
 */
export const getPersonalizedRecommendations = async (userId, limit = 10) => {
  try {
    // Get user's booking history
    const bookings = await Booking.find({ user: userId, status: 'Confirmed' })
      .populate({
        path: 'schedule',
        populate: { path: 'product' }
      });

    // Get user's favorites
    const favorites = await Favorite.find({ user: userId })
      .populate('product');

    // Get user's reviews
    const reviews = await Review.find({ user: userId, status: 'Approved' })
      .populate('product');

    // Extract categories, cities, and operators from user history
    const categories = new Set();
    const cities = new Set();
    const operators = new Set();
    const productIds = new Set();

    bookings.forEach(booking => {
      if (booking.schedule?.product) {
        const product = booking.schedule.product;
        categories.add(product.category);
        cities.add(product.city);
        if (product.operator) operators.add(product.operator.toString());
        productIds.add(product._id.toString());
      }
    });

    favorites.forEach(fav => {
      if (fav.product) {
        categories.add(fav.product.category);
        cities.add(fav.product.city);
        if (fav.product.operator) operators.add(fav.product.operator.toString());
        productIds.add(fav.product._id.toString());
      }
    });

    reviews.forEach(review => {
      if (review.product) {
        categories.add(review.product.category);
        cities.add(review.product.city);
        if (review.product.operator) operators.add(review.product.operator.toString());
        productIds.add(review.product._id.toString());
      }
    });

    // Build recommendation query
    const query = {
      status: 'Published',
      _id: { $nin: Array.from(productIds) }, // Exclude already booked/favorited products
    };

    // Score products based on multiple factors
    const allProducts = await Product.find(query)
      .populate('operator', 'companyName publicName')
      .populate('badges.badgeId')
      .lean();

    // Calculate recommendation scores
    const scoredProducts = allProducts.map(product => {
      let score = 0;

      // Category match (high weight)
      if (categories.has(product.category)) {
        score += 30;
      }

      // City match (medium weight)
      if (cities.has(product.city)) {
        score += 20;
      }

      // Operator match (medium weight) - user liked this operator before
      if (product.operator && operators.has(product.operator._id.toString())) {
        score += 25;
      }

      // Popularity score (based on bookings and reviews)
      const bookingCount = product.metrics?.bookingCount || 0;
      const reviewCount = product.metrics?.reviewCount || 0;
      const averageRating = product.metrics?.averageRating || 0;
      
      score += Math.min(bookingCount * 0.5, 15); // Max 15 points for bookings
      score += Math.min(reviewCount * 0.3, 10); // Max 10 points for reviews
      score += averageRating * 2; // Max 10 points for rating (5 * 2)

      // Badge bonus
      if (product.badges && Array.isArray(product.badges) && product.badges.length > 0) {
        score += product.badges.length * 2; // 2 points per badge
      }

      // Best value bonus
      if (product.metrics?.isBestValue) {
        score += 5;
      }

      // New product bonus (but lower than popular ones)
      if (product.metrics?.isNew) {
        score += 3;
      }

      return { product, score };
    });

    // Sort by score and return top recommendations
    scoredProducts.sort((a, b) => b.score - a.score);

    return scoredProducts
      .slice(0, limit)
      .map(item => item.product);
  } catch (error) {
    console.error('Get personalized recommendations error:', error);
    return [];
  }
};

/**
 * Get similar products to a given product
 * @param {String} productId - Product ID
 * @param {Number} limit - Number of similar products to return
 * @returns {Array} Similar products
 */
export const getSimilarProducts = async (productId, limit = 6) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      return [];
    }

    const query = {
      status: 'Published',
      _id: { $ne: productId },
      $or: [
        { category: product.category },
        { city: product.city },
      ],
    };

    // If product has location, also search by proximity
    if (product.location && product.location.coordinates) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: product.location.coordinates,
          },
          $maxDistance: 50000, // 50km radius
        },
      };
    }

    const similarProducts = await Product.find(query)
      .populate('operator', 'companyName publicName')
      .populate('badges.badgeId')
      .limit(limit)
      .lean();

    // Sort by relevance (category match > city match > rating)
    similarProducts.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (a.category === product.category) scoreA += 10;
      if (b.category === product.category) scoreB += 10;
      if (a.city === product.city) scoreA += 5;
      if (b.city === product.city) scoreB += 5;
      
      const ratingA = a.metrics?.averageRating || 0;
      const ratingB = b.metrics?.averageRating || 0;
      scoreA += ratingA;
      scoreB += ratingB;

      return scoreB - scoreA;
    });

    return similarProducts;
  } catch (error) {
    console.error('Get similar products error:', error);
    return [];
  }
};

/**
 * Get trending products (most booked recently)
 * @param {Number} limit - Number of trending products
 * @param {Number} days - Number of days to look back
 * @returns {Array} Trending products
 */
export const getTrendingProducts = async (limit = 10, days = 30) => {
  try {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Get recent bookings
    const recentBookings = await Booking.find({
      status: 'Confirmed',
      createdAt: { $gte: dateThreshold },
    }).populate({
      path: 'schedule',
      populate: { path: 'product' },
    });

    // Count bookings per product
    const productCounts = {};
    recentBookings.forEach(booking => {
      if (booking.schedule?.product) {
        const productId = booking.schedule.product._id.toString();
        productCounts[productId] = (productCounts[productId] || 0) + 1;
      }
    });

    // Get products sorted by booking count
    const productIds = Object.keys(productCounts)
      .sort((a, b) => productCounts[b] - productCounts[a])
      .slice(0, limit);

    const products = await Product.find({
      _id: { $in: productIds },
      status: 'Published',
    })
      .populate('operator', 'companyName publicName')
      .populate('badges.badgeId')
      .lean();

    // Sort by booking count
    products.sort((a, b) => {
      const countA = productCounts[a._id.toString()] || 0;
      const countB = productCounts[b._id.toString()] || 0;
      return countB - countA;
    });

    return products;
  } catch (error) {
    console.error('Get trending products error:', error);
    return [];
  }
};

/**
 * Get recommended products for new users (no history)
 * @param {Number} limit - Number of recommendations
 * @returns {Array} Recommended products
 */
export const getNewUserRecommendations = async (limit = 10) => {
  try {
    // Return popular, highly-rated products
    const products = await Product.find({
      status: 'Published',
      'metrics.averageRating': { $gte: 4.0 },
      'metrics.bookingCount': { $gte: 5 },
    })
      .populate('operator', 'companyName publicName')
      .populate('badges.badgeId')
      .sort({
        'metrics.averageRating': -1,
        'metrics.bookingCount': -1,
      })
      .limit(limit)
      .lean();

    return products;
  } catch (error) {
    console.error('Get new user recommendations error:', error);
    return [];
  }
};

