import Product from '../models/productModel.js';
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
