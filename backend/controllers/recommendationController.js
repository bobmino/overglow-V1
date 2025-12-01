import {
  getPersonalizedRecommendations,
  getSimilarProducts,
  getTrendingProducts,
  getNewUserRecommendations,
} from '../utils/recommendationService.js';

// @desc    Get personalized recommendations for user
// @route   GET /api/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const recommendations = await getPersonalizedRecommendations(
      req.user._id,
      parseInt(limit)
    );

    res.json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Failed to fetch recommendations' });
  }
};

// @desc    Get similar products
// @route   GET /api/recommendations/similar/:productId
// @access  Public
const getSimilar = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const similarProducts = await getSimilarProducts(
      req.params.productId,
      parseInt(limit)
    );

    res.json(similarProducts);
  } catch (error) {
    console.error('Get similar products error:', error);
    res.status(500).json({ message: 'Failed to fetch similar products' });
  }
};

// @desc    Get trending products
// @route   GET /api/recommendations/trending
// @access  Public
const getTrending = async (req, res) => {
  try {
    const { limit = 10, days = 30 } = req.query;
    const trendingProducts = await getTrendingProducts(
      parseInt(limit),
      parseInt(days)
    );

    res.json(trendingProducts);
  } catch (error) {
    console.error('Get trending products error:', error);
    res.status(500).json({ message: 'Failed to fetch trending products' });
  }
};

// @desc    Get recommendations for new users
// @route   GET /api/recommendations/new-user
// @access  Public
const getNewUserRecs = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const recommendations = await getNewUserRecommendations(parseInt(limit));

    res.json(recommendations);
  } catch (error) {
    console.error('Get new user recommendations error:', error);
    res.status(500).json({ message: 'Failed to fetch recommendations' });
  }
};

export {
  getRecommendations,
  getSimilar,
  getTrending,
  getNewUserRecs,
};

