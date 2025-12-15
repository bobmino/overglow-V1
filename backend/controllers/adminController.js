import User from '../models/userModel.js';
import Operator from '../models/operatorModel.js';
import Product from '../models/productModel.js';
import Booking from '../models/bookingModel.js';
import { 
  notifyProductApproved,
  notifyOperatorApproved,
  notifyOnboardingApproved,
  notifyOnboardingRejected,
} from '../utils/notificationService.js';
import { 
  initializeDefaultBadges, 
  updateProductMetrics, 
  updateOperatorMetrics 
} from '../utils/badgeService.js';
import Badge from '../models/badgeModel.js';

// Normalize operator status to valid enum values
const normalizeOperatorStatus = (operator) => {
  if (!operator || !operator.status) return;
  
  const validStatuses = ['Pending', 'Under Review', 'Active', 'Suspended', 'Rejected'];
  if (!validStatuses.includes(operator.status)) {
    // Map old status values to new ones
    if (operator.status === 'Verified') {
      operator.status = 'Active';
    } else {
      operator.status = 'Pending'; // Default fallback
    }
  }
};

// Save operator with status normalization
const saveOperatorSafely = async (operator) => {
  normalizeOperatorStatus(operator);
  try {
    await operator.save();
  } catch (saveError) {
    // If save fails due to status validation, fix it and retry once
    if (saveError.name === 'ValidationError' && saveError.errors?.status) {
      operator.status = 'Active'; // Force to Active
      await operator.save({ validateBeforeSave: false }); // Skip validation this time
    } else {
      throw saveError; // Re-throw if it's a different error
    }
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOperators = await Operator.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalBookings = await Booking.countDocuments();
    
    const pendingProducts = await Product.countDocuments({ status: 'Pending Review' });
    const publishedProducts = await Product.countDocuments({ status: 'Published' });
    
    const totalRevenue = await Booking.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    
    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
    
    const operatorsByStatus = await Operator.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    res.json({
      totalUsers,
      totalOperators,
      totalProducts,
      totalBookings,
      pendingProducts,
      publishedProducts,
      totalRevenue: revenue,
      operatorsByStatus: operatorsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
};

// @desc    Get all operators
// @route   GET /api/admin/operators
// @access  Private/Admin
const getOperators = async (req, res) => {
  try {
    const { status, onboardingStatus } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    const operators = await Operator.find(query)
      .populate('user', 'name email')
      .populate('badges.badgeId')
      .sort({ createdAt: -1 });
    
    // If filtering by onboarding status, we need to check OperatorOnboarding
    if (onboardingStatus) {
      const OperatorOnboarding = (await import('../models/operatorOnboardingModel.js')).default;
      const onboardingRecords = await OperatorOnboarding.find({ 
        onboardingStatus,
        operator: { $in: operators.map(op => op._id) }
      });
      const operatorIds = onboardingRecords.map(rec => rec.operator.toString());
      const filteredOperators = operators.filter(op => operatorIds.includes(op._id.toString()));
      
      // Populate onboarding data
      const operatorsWithOnboarding = await Promise.all(
        filteredOperators.map(async (operator) => {
          const onboarding = await OperatorOnboarding.findOne({ operator: operator._id });
          return {
            ...operator.toObject(),
            onboarding,
          };
        })
      );
      
      return res.json(operatorsWithOnboarding);
    }
    
    // Populate onboarding data for all operators
    const OperatorOnboarding = (await import('../models/operatorOnboardingModel.js')).default;
    const operatorsWithOnboarding = await Promise.all(
      operators.map(async (operator) => {
        const onboarding = await OperatorOnboarding.findOne({ operator: operator._id });
        return {
          ...operator.toObject(),
          onboarding,
        };
      })
    );
    
    res.json(operatorsWithOnboarding);
  } catch (error) {
    console.error('Get operators error:', error);
    res.status(500).json({ message: 'Failed to fetch operators' });
  }
};

// @desc    Update operator status
// @route   PUT /api/admin/operators/:id/status
// @access  Private/Admin
const updateOperatorStatus = async (req, res) => {
  try {
    const { status, rejectionReason, approvalNotes, autoApproveProducts } = req.body;
    const operator = await Operator.findById(req.params.id);

    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }

    const oldStatus = operator.status;
    
    // Update status only if provided
    if (status !== undefined && status !== null) {
      // Validate status before setting
      const validStatuses = ['Pending', 'Under Review', 'Active', 'Suspended', 'Rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}` });
      }
      
      operator.status = status;
      operator.reviewedBy = req.user._id;
      operator.reviewedAt = new Date();
      
      if (status === 'Rejected' && rejectionReason) {
        operator.rejectionReason = rejectionReason;
      }
      
      if (status === 'Active') {
        operator.approvedAt = new Date();
      }
    }
    
    // Update auto-approve products setting if provided
    if (autoApproveProducts !== undefined) {
      operator.autoApproveProducts = autoApproveProducts === true;
    }
    
    // Use safe save to handle any status normalization issues
    await saveOperatorSafely(operator);
    
    // Update onboarding status if exists
    const OperatorOnboarding = (await import('../models/operatorOnboardingModel.js')).default;
    const onboarding = await OperatorOnboarding.findOne({ operator: operator._id });
    
    if (onboarding && status !== undefined && status !== null) {
      if (status === 'Active') {
        onboarding.onboardingStatus = 'approved';
        onboarding.reviewedBy = req.user._id;
        onboarding.reviewedAt = new Date();
        if (approvalNotes) {
          onboarding.approvalNotes = approvalNotes;
        }
        await onboarding.save();
        
        // Notify operator of onboarding approval
        await notifyOnboardingApproved(onboarding, operator.user);
      } else if (status === 'Rejected') {
        onboarding.onboardingStatus = 'rejected';
        onboarding.reviewedBy = req.user._id;
        onboarding.reviewedAt = new Date();
        if (rejectionReason) {
          onboarding.rejectionReason = rejectionReason;
        }
        await onboarding.save();
        
        // Notify operator of onboarding rejection
        await notifyOnboardingRejected(onboarding, operator.user, rejectionReason);
      }
    }
    
    // If operator is approved (Active), also approve the user
    if (status !== undefined && status !== null && oldStatus !== 'Active' && status === 'Active') {
      const user = await User.findById(operator.user);
      if (user) {
        user.isApproved = true;
        user.approvedAt = new Date();
        await user.save();
      }
      
      // Notify operator of operator account approval
      await notifyOperatorApproved(operator, req.user._id);
    }
    
    // Populate operator with user info for response
    const populatedOperator = await Operator.findById(operator._id)
      .populate('user', 'name email')
      .populate('reviewedBy', 'name');
    
    res.json(populatedOperator);
  } catch (error) {
    console.error('Update operator status error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      operatorId: req.params.id,
      status: req.body.status,
    });
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to update operator status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all products for admin
// @route   GET /api/admin/products
// @access  Private/Admin
const getProducts = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .select('title images city category price status operator badges createdAt')
      .populate('operator', 'companyName')
      .populate('badges.badgeId', 'name icon color')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Product.countDocuments(query);
    
    res.json({
      products: Array.isArray(products) ? products : [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

// @desc    Update product status
// @route   PUT /api/admin/products/:id/status
// @access  Private/Admin
const updateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      const oldStatus = product.status;
      product.status = status;
      await product.save();
      
      // Notify operator if product was approved
      if (oldStatus !== 'Published' && status === 'Published') {
        await notifyProductApproved(product, product.operator);
      }
      
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({ message: 'Failed to update product status' });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// @desc    Initialize badges and set authenticity flags for all products/operators
// @route   POST /api/admin/initialize-badges
// @access  Private/Admin
const initializeBadgesAndFlags = async (req, res) => {
  try {
    // Step 1: Initialize default badges
    await initializeDefaultBadges();
    
    // Step 2: Get all products and operators
    const products = await Product.find({});
    const operators = await Operator.find({});
    
    // Step 3: Mark products with default authenticity flags
    let productsUpdated = 0;
    for (const product of products) {
      const needsUpdate = !product.authenticity || 
        product.authenticity.isArtisan === undefined ||
        product.authenticity.isAuthenticLocal === undefined;
      
      if (needsUpdate) {
        product.authenticity = {
          isArtisan: false,
          isAuthenticLocal: true, // Default: assume local products are authentic
          isEcoFriendly: false,
          isTraditional: true, // Default: assume traditional
          isLocal100: true, // Default: assume 100% local
        };
        await product.save();
        productsUpdated++;
      }
    }
    
    // Step 4: Mark operators with default authenticity flags
    let operatorsUpdated = 0;
    for (const operator of operators) {
      const needsUpdate = !operator.authenticity || 
        operator.authenticity.isArtisan === undefined ||
        operator.authenticity.isAuthenticLocal === undefined;
      
      if (needsUpdate) {
        operator.authenticity = {
          isArtisan: false,
          isAuthenticLocal: true, // Default: assume local operators are authentic
          isEcoFriendly: false,
          isLocal100: true, // Default: assume 100% local
          isTraditional: true, // Default: assume traditional
        };
        await operator.save();
        operatorsUpdated++;
      }
    }
    
    // Step 5: Calculate and assign badges for all products
    let productsWithBadges = 0;
    let productsWithErrors = 0;
    for (const product of products) {
      try {
        await updateProductMetrics(product._id);
        productsWithBadges++;
      } catch (error) {
        console.error(`Error updating badges for product ${product._id}:`, error.message);
        productsWithErrors++;
      }
    }
    
    // Step 6: Calculate and assign badges for all operators
    let operatorsWithBadges = 0;
    let operatorsWithErrors = 0;
    for (const operator of operators) {
      try {
        await updateOperatorMetrics(operator._id);
        operatorsWithBadges++;
      } catch (error) {
        console.error(`Error updating badges for operator ${operator._id}:`, error.message);
        operatorsWithErrors++;
      }
    }
    
    res.json({
      message: 'Badges initialized successfully',
      summary: {
        badgesInitialized: true,
        productsUpdated,
        operatorsUpdated,
        productsWithBadges,
        operatorsWithBadges,
        productsWithErrors,
        operatorsWithErrors,
        totalProducts: products.length,
        totalOperators: operators.length,
      },
    });
  } catch (error) {
    console.error('Initialize badges error:', error);
    res.status(500).json({ 
      message: 'Failed to initialize badges',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create a new badge
// @route   POST /api/admin/badges
// @access  Private/Admin
const createBadge = async (req, res) => {
  try {
    const { name, type, icon, color, description, criteria, isAutomatic } = req.body;

    if (!name || !type || !description) {
      return res.status(400).json({ message: 'Name, type, and description are required' });
    }

    const Badge = (await import('../models/badgeModel.js')).default;
    
    // Clean criteria object - remove null/undefined/empty values
    let cleanCriteria = {};
    if (criteria && typeof criteria === 'object') {
      Object.keys(criteria).forEach(key => {
        const value = criteria[key];
        if (value !== null && value !== undefined && value !== '') {
          // Convert string numbers to actual numbers
          if (['minRating', 'minReviews', 'minBookings', 'minRevenue', 'minViewCount', 'minBookingCount', 'maxResponseTime', 'minCompletionRate'].includes(key)) {
            cleanCriteria[key] = Number(value);
          } else if (['isVerified', 'isLocal', 'isLocal100', 'isArtisan', 'isAuthenticLocal', 'isEcoFriendly', 'isTraditional', 'isNew', 'isBestValue', 'isLastMinute'].includes(key)) {
            cleanCriteria[key] = value === true || value === 'true';
          } else {
            cleanCriteria[key] = value;
          }
        }
      });
    }

    const badge = await Badge.create({
      name,
      type,
      icon: icon || '🏆',
      color: color || '#059669',
      description,
      criteria: cleanCriteria,
      isAutomatic: isAutomatic !== undefined ? isAutomatic : true,
      isActive: true,
    });

    res.status(201).json(badge);
  } catch (error) {
    console.error('Create badge error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Badge with this name and type already exists' });
    }
    res.status(500).json({ 
      message: 'Failed to create badge',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all badges (admin view)
// @route   GET /api/admin/badges
// @access  Private/Admin
const getAllBadges = async (req, res) => {
  try {
    const { type, isAutomatic } = req.query;
    const Badge = (await import('../models/badgeModel.js')).default;
    
    const query = {};
    if (type) query.type = type;
    if (isAutomatic !== undefined) query.isAutomatic = isAutomatic === 'true';

    const badges = await Badge.find(query).sort({ type: 1, name: 1 });
    res.json(badges);
  } catch (error) {
    console.error('Get all badges error:', error);
    res.status(500).json({ message: 'Failed to fetch badges' });
  }
};

// @desc    Get badges available for request (manual badges)
// @route   GET /api/admin/badges/requestable
// @access  Private/Admin
const getRequestableBadges = async (req, res) => {
  try {
    const { type } = req.query;
    const Badge = (await import('../models/badgeModel.js')).default;
    
    const query = { isAutomatic: false, isActive: true };
    if (type) query.type = type;

    const badges = await Badge.find(query).sort({ name: 1 });
    res.json(badges);
  } catch (error) {
    console.error('Get requestable badges error:', error);
    res.status(500).json({ message: 'Failed to fetch requestable badges' });
  }
};

// @desc    Assign badge to multiple products
// @route   POST /api/admin/badges/assign-products
// @access  Private/Admin
const assignBadgeToProducts = async (req, res) => {
  try {
    const { badgeId, productIds } = req.body;

    if (!badgeId || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Badge ID and product IDs array are required' });
    }

    const Badge = (await import('../models/badgeModel.js')).default;
    const badge = await Badge.findById(badgeId);
    
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }

    if (badge.type !== 'product') {
      return res.status(400).json({ message: 'Badge is not a product badge' });
    }

    let assigned = 0;
    let errors = 0;

    for (const productId of productIds) {
      try {
        const product = await Product.findById(productId);
        if (!product) {
          errors++;
          continue;
        }

        // Check if badge already assigned
        const existingBadge = product.badges.find(
          b => b.badgeId && b.badgeId.toString() === badgeId
        );

        if (!existingBadge) {
          product.badges.push({
            badgeId: badge._id,
            assignedAt: new Date(),
            assignedBy: req.user._id,
          });
          await product.save({ validateBeforeSave: false });
          assigned++;
        }

        // Recalculate badges to ensure consistency
        await updateProductMetrics(productId);
      } catch (error) {
        console.error(`Error assigning badge to product ${productId}:`, error.message);
        errors++;
      }
    }

    res.json({
      message: 'Badge assignment completed',
      assigned,
      errors,
      total: productIds.length,
    });
  } catch (error) {
    console.error('Assign badge to products error:', error);
    res.status(500).json({ 
      message: 'Failed to assign badge to products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Assign badge to multiple operators
// @route   POST /api/admin/badges/assign-operators
// @access  Private/Admin
const assignBadgeToOperators = async (req, res) => {
  try {
    const { badgeId, operatorIds } = req.body;

    if (!badgeId || !operatorIds || !Array.isArray(operatorIds) || operatorIds.length === 0) {
      return res.status(400).json({ message: 'Badge ID and operator IDs array are required' });
    }

    const Badge = (await import('../models/badgeModel.js')).default;
    const badge = await Badge.findById(badgeId);
    
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }

    if (badge.type !== 'operator') {
      return res.status(400).json({ message: 'Badge is not an operator badge' });
    }

    let assigned = 0;
    let errors = 0;

    for (const operatorId of operatorIds) {
      try {
        const operator = await Operator.findById(operatorId);
        if (!operator) {
          errors++;
          continue;
        }

        // Check if badge already assigned
        const existingBadge = operator.badges.find(
          b => b.badgeId && b.badgeId.toString() === badgeId
        );

        if (!existingBadge) {
          operator.badges.push({
            badgeId: badge._id,
            assignedAt: new Date(),
            assignedBy: req.user._id,
          });
          await operator.save({ validateBeforeSave: false });
          assigned++;
        }

        // Recalculate badges to ensure consistency
        await updateOperatorMetrics(operatorId);
      } catch (error) {
        console.error(`Error assigning badge to operator ${operatorId}:`, error.message);
        errors++;
      }
    }

    res.json({
      message: 'Badge assignment completed',
      assigned,
      errors,
      total: operatorIds.length,
    });
  } catch (error) {
    console.error('Assign badge to operators error:', error);
    res.status(500).json({ 
      message: 'Failed to assign badge to operators',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update badge
// @route   PUT /api/admin/badges/:id
// @access  Private/Admin
const updateBadge = async (req, res) => {
  try {
    const Badge = (await import('../models/badgeModel.js')).default;
    const badge = await Badge.findById(req.params.id);
    
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }

    const { name, icon, color, description, criteria, isAutomatic, isActive } = req.body;

    if (name) badge.name = name;
    if (icon) badge.icon = icon;
    if (color) badge.color = color;
    if (description) badge.description = description;
    
    // Update criteria - merge with existing, allow clearing
    if (criteria !== undefined) {
      badge.criteria = { ...badge.criteria };
      Object.keys(criteria || {}).forEach(key => {
        const value = criteria[key];
        if (value === null || value === undefined || value === '') {
          delete badge.criteria[key];
          return;
        }

        // Cast numeric fields
        if (['minRating', 'minReviews', 'minBookings', 'minRevenue', 'minViewCount', 'minBookingCount', 'maxResponseTime', 'minCompletionRate'].includes(key)) {
          badge.criteria[key] = Number(value);
          return;
        }

        // Cast boolean fields
        if (['isVerified', 'isLocal', 'isLocal100', 'isArtisan', 'isAuthenticLocal', 'isEcoFriendly', 'isTraditional', 'isNew', 'isBestValue', 'isLastMinute'].includes(key)) {
          badge.criteria[key] = value === true || value === 'true';
          return;
        }

        badge.criteria[key] = value;
      });
    }
    
    if (isAutomatic !== undefined) badge.isAutomatic = isAutomatic;
    if (isActive !== undefined) badge.isActive = isActive;

    await badge.save();
    res.json(badge);
  } catch (error) {
    console.error('Update badge error:', error);
    res.status(500).json({ 
      message: 'Failed to update badge',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete badge
// @route   DELETE /api/admin/badges/:id
// @access  Private/Admin
const deleteBadge = async (req, res) => {
  try {
    const Badge = (await import('../models/badgeModel.js')).default;
    const badge = await Badge.findById(req.params.id);
    
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }

    // Instead of deleting, mark as inactive
    badge.isActive = false;
    await badge.save();

    res.json({ message: 'Badge deactivated successfully' });
  } catch (error) {
    console.error('Delete badge error:', error);
    res.status(500).json({ 
      message: 'Failed to delete badge',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get products that have a specific badge
// @route   GET /api/admin/badges/:badgeId/products
// @access  Private/Admin
const getProductsByBadge = async (req, res) => {
  try {
    const { badgeId } = req.params;
    const badge = await Badge.findById(badgeId);
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }

    const products = await Product.find({ 'badges.badgeId': badgeId })
      .populate('operator', 'companyName')
      .populate('badges.badgeId')
      .sort({ createdAt: -1 });

    res.json({ badge, products });
  } catch (error) {
    console.error('Get products by badge error:', error);
    res.status(500).json({ message: 'Failed to fetch products for badge' });
  }
};

// @desc    Get operators that have a specific badge
// @route   GET /api/admin/badges/:badgeId/operators
// @access  Private/Admin
const getOperatorsByBadge = async (req, res) => {
  try {
    const { badgeId } = req.params;
    const badge = await Badge.findById(badgeId);
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }

    const operators = await Operator.find({ 'badges.badgeId': badgeId })
      .populate('user', 'name email')
      .populate('badges.badgeId')
      .sort({ createdAt: -1 });

    res.json({ badge, operators });
  } catch (error) {
    console.error('Get operators by badge error:', error);
    res.status(500).json({ message: 'Failed to fetch operators for badge' });
  }
};

export { 
  getAdminStats,
  getOperators, 
  updateOperatorStatus, 
  getProducts,
  updateProductStatus, 
  getUsers, 
  deleteUser,
  initializeBadgesAndFlags,
  createBadge,
  getAllBadges,
  getRequestableBadges,
  assignBadgeToProducts,
  assignBadgeToOperators,
  updateBadge,
  deleteBadge,
  getProductsByBadge,
  getOperatorsByBadge,
};
