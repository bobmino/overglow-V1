import Badge from '../models/badgeModel.js';
import Operator from '../models/operatorModel.js';
import Product from '../models/productModel.js';
import { updateOperatorMetrics, updateProductMetrics, initializeDefaultBadges } from '../utils/badgeService.js';

// @desc    Get all badges
// @route   GET /api/badges
// @access  Public
const getBadges = async (req, res) => {
  try {
    const { type } = req.query;
    const query = { isActive: true };
    if (type) {
      query.type = type;
    }

    const badges = await Badge.find(query).sort({ name: 1 });
    res.json(badges);
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ message: 'Failed to fetch badges' });
  }
};

// @desc    Get badges for an operator
// @route   GET /api/badges/operator/:operatorId
// @access  Public
const getOperatorBadges = async (req, res) => {
  try {
    const operator = await Operator.findById(req.params.operatorId)
      .populate('badges.badgeId');
    
    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }

    res.json(operator.badges || []);
  } catch (error) {
    console.error('Get operator badges error:', error);
    res.status(500).json({ message: 'Failed to fetch operator badges' });
  }
};

// @desc    Get badges for a product
// @route   GET /api/badges/product/:productId
// @access  Public
const getProductBadges = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
      .populate('badges.badgeId');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product.badges || []);
  } catch (error) {
    console.error('Get product badges error:', error);
    res.status(500).json({ message: 'Failed to fetch product badges' });
  }
};

// @desc    Update operator metrics and badges
// @route   POST /api/badges/update-operator/:operatorId
// @access  Private/Admin or Operator
const updateOperatorBadges = async (req, res) => {
  try {
    await updateOperatorMetrics(req.params.operatorId);
    res.json({ message: 'Operator metrics and badges updated' });
  } catch (error) {
    console.error('Update operator badges error:', error);
    res.status(500).json({ message: 'Failed to update operator badges' });
  }
};

// @desc    Update product metrics and badges
// @route   POST /api/badges/update-product/:productId
// @access  Private/Admin or Operator
const updateProductBadges = async (req, res) => {
  try {
    await updateProductMetrics(req.params.productId);
    res.json({ message: 'Product metrics and badges updated' });
  } catch (error) {
    console.error('Update product badges error:', error);
    res.status(500).json({ message: 'Failed to update product badges' });
  }
};

// @desc    Initialize default badges (admin only)
// @route   POST /api/badges/initialize
// @access  Private/Admin
const initializeBadges = async (req, res) => {
  try {
    await initializeDefaultBadges();
    res.json({ message: 'Default badges initialized' });
  } catch (error) {
    console.error('Initialize badges error:', error);
    res.status(500).json({ message: 'Failed to initialize badges' });
  }
};

export {
  getBadges,
  getOperatorBadges,
  getProductBadges,
  updateOperatorBadges,
  updateProductBadges,
  initializeBadges,
};
