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
    const products = await Product.find(query)
      .populate('operator', 'companyName')
      .sort({ createdAt: -1 });
    res.json(products);
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

export { 
  getAdminStats,
  getOperators, 
  updateOperatorStatus, 
  getProducts,
  updateProductStatus, 
  getUsers, 
  deleteUser 
};
