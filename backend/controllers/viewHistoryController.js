import ViewHistory from '../models/viewHistoryModel.js';
import Product from '../models/productModel.js';

// @desc    Record product view
// @route   POST /api/view-history
// @access  Private
const recordView = async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user already viewed this product today (avoid duplicates)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingView = await ViewHistory.findOne({
      user: req.user._id,
      product: productId,
      viewedAt: {
        $gte: today,
        $lt: tomorrow,
      },
    });
    
    if (!existingView) {
      // Create new view record
      await ViewHistory.create({
        user: req.user._id,
        product: productId,
        viewedAt: new Date(),
      });
    }
    
    res.json({ message: 'View recorded' });
  } catch (error) {
    console.error('Record view error:', error);
    res.status(500).json({ message: 'Failed to record view' });
  }
};

// @desc    Get user's recently viewed products
// @route   GET /api/view-history
// @access  Private
const getViewHistory = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const views = await ViewHistory.find({ user: req.user._id })
      .populate('product', 'title images city category price')
      .sort({ viewedAt: -1 })
      .limit(parseInt(limit));
    
    // Extract unique products (most recent view for each)
    const productMap = new Map();
    views.forEach(view => {
      if (view.product && !productMap.has(view.product._id.toString())) {
        productMap.set(view.product._id.toString(), view.product);
      }
    });
    
    const products = Array.from(productMap.values());
    
    res.json(products);
  } catch (error) {
    console.error('Get view history error:', error);
    res.status(500).json({ message: 'Failed to fetch view history' });
  }
};

// @desc    Clear view history
// @route   DELETE /api/view-history
// @access  Private
const clearViewHistory = async (req, res) => {
  try {
    await ViewHistory.deleteMany({ user: req.user._id });
    res.json({ message: 'View history cleared' });
  } catch (error) {
    console.error('Clear view history error:', error);
    res.status(500).json({ message: 'Failed to clear view history' });
  }
};

export {
  recordView,
  getViewHistory,
  clearViewHistory,
};

