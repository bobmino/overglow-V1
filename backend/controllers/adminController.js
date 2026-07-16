import User from '../models/userModel.js';
import Operator from '../models/operatorModel.js';
import Product from '../models/productModel.js';
import Booking from '../models/bookingModel.js';
import Schedule from '../models/scheduleModel.js';
import { logger } from '../utils/logger.js';
import {
  notifyProductApproved,
  notifyProductRejected,
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
import { sendOperatorApprovedEmail, sendOperatorRejectedEmail, sendBookingConfirmation, sendCancellationEmail } from '../utils/emailService.js';

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

// @desc    Get admin dashboard stats (period-aware command center)
// @route   GET /api/admin/stats?period=30d
// @access  Private/Admin
const resolvePeriodRange = (period = '30d', dateFrom, dateTo) => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  let start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (period) {
    case 'today':
      break;
    case '7d':
      start.setDate(start.getDate() - 6);
      break;
    case '90d':
      start.setDate(start.getDate() - 89);
      break;
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'lastMonth': {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end: lastEnd };
    }
    case 'custom':
      if (dateFrom) start = new Date(dateFrom);
      if (dateTo) {
        const e = new Date(dateTo);
        e.setHours(23, 59, 59, 999);
        return { start, end: e };
      }
      break;
    case '30d':
    default:
      start.setDate(start.getDate() - 29);
      break;
  }

  return { start, end };
};

const previousRangeFrom = (start, end) => {
  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  return { start: prevStart, end: prevEnd };
};

const sumBookingMetrics = async (rangeStart, rangeEnd) => {
  const match = {
    createdAt: { $gte: rangeStart, $lte: rangeEnd },
    status: { $ne: 'Cancelled' },
  };
  const [bookings, revenueAgg, users] = await Promise.all([
    Booking.countDocuments(match),
    Booking.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } } } },
    ]),
    User.countDocuments({ createdAt: { $gte: rangeStart, $lte: rangeEnd } }),
  ]);
  return {
    bookings,
    revenue: revenueAgg[0]?.total || 0,
    users,
  };
};

const getAdminStats = async (req, res) => {
  try {
    const period = req.query.period || '30d';
    const { start, end } = resolvePeriodRange(period, req.query.dateFrom, req.query.dateTo);
    const prev = previousRangeFrom(start, end);

    const [
      current,
      previous,
      totalUsers,
      totalOperators,
      totalProducts,
      totalBookings,
      pendingProducts,
      publishedProducts,
      lifetimeRevenueAgg,
      pendingOperators,
      pendingPayments,
      pendingApprovals,
      unreadNotifications,
      topProductsRaw,
      recentBookings,
      recentUsers,
      recentOperators,
      recentWithdrawals,
      revenueSeriesCurrent,
      revenueSeriesPrevious,
    ] = await Promise.all([
      sumBookingMetrics(start, end),
      sumBookingMetrics(prev.start, prev.end),
      User.countDocuments(),
      Operator.countDocuments(),
      Product.countDocuments(),
      Booking.countDocuments(),
      Product.countDocuments({ status: 'Pending Review' }),
      Product.countDocuments({ status: 'Published' }),
      Booking.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } } } },
      ]),
      Operator.countDocuments({ status: { $in: ['Pending', 'Under Review'] } }),
      Booking.countDocuments({ status: 'PENDING_PAYMENT' }),
      (async () => {
        try {
          const ApprovalRequest = (await import('../models/approvalRequestModel.js')).default;
          return ApprovalRequest.countDocuments({ status: 'pending' });
        } catch {
          return 0;
        }
      })(),
      (async () => {
        try {
          const Notification = (await import('../models/notificationModel.js')).default;
          return Notification.countDocuments({ isRead: false });
        } catch {
          return 0;
        }
      })(),
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: { $ne: 'Cancelled' },
          },
        },
        {
          $lookup: {
            from: 'schedules',
            localField: 'schedule',
            foreignField: '_id',
            as: 'scheduleData',
          },
        },
        { $unwind: { path: '$scheduleData', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'products',
            localField: 'scheduleData.product',
            foreignField: '_id',
            as: 'productData',
          },
        },
        { $unwind: { path: '$productData', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$productData._id',
            name: { $first: { $ifNull: ['$productData.title', 'Produit inconnu'] } },
            bookings: { $sum: 1 },
            revenue: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
      Booking.find({}).sort({ createdAt: -1 }).limit(10).populate('user', 'name').lean(),
      User.find({}).sort({ createdAt: -1 }).limit(10).select('name email createdAt').lean(),
      Operator.find({}).sort({ createdAt: -1 }).limit(10).select('companyName publicName createdAt status').lean(),
      (async () => {
        try {
          const Withdrawal = (await import('../models/withdrawalModel.js')).default;
          return Withdrawal.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .select('amount status type createdAt')
            .lean();
        } catch {
          return [];
        }
      })(),
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: { $ne: 'Cancelled' },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: prev.start, $lte: prev.end },
            status: { $ne: 'Cancelled' },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const conversion = (m) => (m.users > 0 ? Math.round((m.bookings / m.users) * 1000) / 10 : 0);

    const recentActivity = [
      ...recentBookings.map((b) => ({
        type: 'booking',
        description: `Nouvelle réservation${b.user?.name ? ` — ${b.user.name}` : ''}`,
        timestamp: b.createdAt,
        link: '/admin/bookings',
      })),
      ...recentUsers.map((u) => ({
        type: 'user',
        description: `Nouvel utilisateur — ${u.name || u.email}`,
        timestamp: u.createdAt,
        link: '/admin/users',
      })),
      ...recentOperators.map((o) => ({
        type: 'operator',
        description: `Inscription opérateur — ${o.companyName || o.publicName || 'Sans nom'}`,
        timestamp: o.createdAt,
        link: '/admin/operators',
      })),
      ...recentWithdrawals.map((w) => ({
        type: 'withdrawal',
        description: `Demande de retrait — ${Number(w.amount || 0).toFixed(2)} (${w.status})`,
        timestamp: w.createdAt,
        link: '/admin/withdrawals',
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    const topProducts = topProductsRaw.map((p) => ({
      id: p._id,
      name: p.name,
      bookings: p.bookings,
      revenue: p.revenue,
    }));

    // Align series for chart: label by index day offset
    const buildAlignedSeries = (currSeries, prevSeries) => {
      const maxLen = Math.max(currSeries.length, prevSeries.length, 1);
      const rows = [];
      for (let i = 0; i < maxLen; i += 1) {
        rows.push({
          label: currSeries[i]?._id || prevSeries[i]?._id || `J${i + 1}`,
          current: currSeries[i]?.revenue || 0,
          previous: prevSeries[i]?.revenue || 0,
        });
      }
      return rows;
    };

    res.json({
      // Backward-compatible lifetime fields
      totalUsers,
      totalOperators,
      totalProducts,
      totalBookings,
      pendingProducts,
      publishedProducts,
      totalRevenue: lifetimeRevenueAgg[0]?.total || 0,
      // [PROMPT-4] Period command center
      period,
      range: { from: start, to: end },
      current: {
        revenue: current.revenue,
        bookings: current.bookings,
        users: current.users,
        conversion: conversion(current),
      },
      previous: {
        revenue: previous.revenue,
        bookings: previous.bookings,
        users: previous.users,
        conversion: conversion(previous),
      },
      pendingActions: {
        operators: pendingOperators,
        products: pendingProducts,
        payments: pendingPayments,
        approvals: pendingApprovals,
        unreadNotifications,
      },
      topProducts,
      recentActivity,
      revenueChart: buildAlignedSeries(revenueSeriesCurrent, revenueSeriesPrevious),
    });
  } catch (error) {
    logger.error('Get admin stats error:', error);
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
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const skip = (page - 1) * limit;
    
    if (status) {
      query.status = status;
    }
    
    const operators = await Operator.find(query)
      .populate('user', 'name email')
      .populate('badges.badgeId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const OperatorOnboarding = (await import('../models/operatorOnboardingModel.js')).default;
    const onboardings = await OperatorOnboarding.find({
      operator: { $in: operators.map((op) => op._id) },
    });
    const onboardingByOperator = new Map(
      onboardings.map((rec) => [rec.operator.toString(), rec])
    );

    let result = operators.map((operator) => ({
      ...operator.toObject(),
      onboarding: onboardingByOperator.get(operator._id.toString()) || null,
    }));

    if (onboardingStatus) {
      result = result.filter((op) => op.onboarding?.onboardingStatus === onboardingStatus);
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Get operators error:', error);
    res.status(500).json({ message: 'Failed to fetch operators' });
  }
};

// @desc    Update operator status
// @route   PUT /api/admin/operators/:id/status
// @access  Private/Admin
// @desc    Update operator profile fields (admin direction)
// @route   PUT /api/admin/operators/:id
// @access  Private/Admin
const updateOperator = async (req, res) => {
  try {
    const operator = await Operator.findById(req.params.id);
    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }

    const {
      companyName,
      publicName,
      description,
      phone,
      autoApproveProducts,
      adminNotes,
      location,
    } = req.body;

    if (companyName !== undefined) operator.companyName = String(companyName).trim();
    if (publicName !== undefined) operator.publicName = String(publicName).trim();
    if (description !== undefined) operator.description = String(description).trim();
    if (phone !== undefined) operator.phone = String(phone).trim();
    if (adminNotes !== undefined) operator.adminNotes = String(adminNotes).trim();
    if (autoApproveProducts !== undefined) {
      operator.autoApproveProducts = autoApproveProducts === true;
    }
    if (location && typeof location === 'object') {
      operator.location = {
        ...(operator.location?.toObject?.() || operator.location || {}),
        city: location.city !== undefined ? String(location.city).trim() : operator.location?.city,
        address:
          location.address !== undefined
            ? String(location.address).trim()
            : operator.location?.address,
        postalCode:
          location.postalCode !== undefined
            ? String(location.postalCode).trim()
            : operator.location?.postalCode,
        country:
          location.country !== undefined
            ? String(location.country).trim()
            : operator.location?.country || 'Maroc',
      };
    }

    await saveOperatorSafely(operator);

    const populated = await Operator.findById(operator._id)
      .populate('user', 'name email')
      .populate('reviewedBy', 'name');

    res.json(populated);
  } catch (error) {
    logger.error('Update operator error:', error);
    res.status(500).json({ message: 'Failed to update operator' });
  }
};

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
        const rejectedUser = await User.findById(operator.user);
        if (rejectedUser?.email) {
          sendOperatorRejectedEmail(rejectedUser, rejectionReason).catch((err) =>
            logger.error('Failed to send rejected email:', err)
          );
        }
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
      
      // Send email to operator
      if (user) {
        sendOperatorApprovedEmail(user).catch(err => logger.error('Failed to send approved email:', err));
      }
    }
    
    // Populate operator with user info for response
    const populatedOperator = await Operator.findById(operator._id)
      .populate('user', 'name email')
      .populate('reviewedBy', 'name');
    
    res.json(populatedOperator);
  } catch (error) {
    logger.error('Update operator status error:', error);
    logger.error('Error details:', {
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
    const { status, search, operator, q } = req.query;
    const query = {};
    if (status) query.status = status;
    if (operator) query.operator = operator;

    const term = (search || q || '').toString().trim();
    if (term) {
      const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ title: rx }, { city: rx }, { category: rx }];
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 24));
    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .select('title description images city category price status operator badges createdAt')
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
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

// @desc    Update product status
// @route   PUT /api/admin/products/:id/status
// @access  Private/Admin
const updateProductStatus = async (req, res) => {
  try {
    const { status, reason, rejectionReason } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      const oldStatus = product.status;
      product.status = status;
      await product.save();

      // Resolve operator → user id for notifications
      let operatorUserId = null;
      if (product.operator) {
        const opDoc = await Operator.findById(product.operator).select('user');
        operatorUserId = opDoc?.user || null;
      }

      // Notify operator if product was approved
      if (operatorUserId && oldStatus !== 'Published' && status === 'Published') {
        await notifyProductApproved(product, operatorUserId);
      }

      // Reject = Pending Review → Draft (admin reject button)
      if (
        operatorUserId &&
        oldStatus === 'Pending Review' &&
        status === 'Draft'
      ) {
        await notifyProductRejected(
          product,
          operatorUserId,
          reason || rejectionReason || ''
        );
      }

      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    logger.error('Update product status error:', error);
    res.status(500).json({ message: 'Failed to update product status' });
  }
};

// @desc    Assign, modify, or clone product to an operator
// @route   POST /api/admin/products/:id/assign
// @access  Private/Admin
const assignProductToOperator = async (req, res) => {
  try {
    const { operatorId, clone, updates } = req.body;
    const originalProduct = await Product.findById(req.params.id);

    if (!originalProduct) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    const targetOperator = await Operator.findById(operatorId);
    if (!targetOperator) {
      return res.status(404).json({ message: 'Opérateur introuvable' });
    }

    if (clone) {
      // Create a cloned product
      const newProductData = originalProduct.toObject();
      delete newProductData._id;
      delete newProductData.createdAt;
      delete newProductData.updatedAt;
      
      // Apply updates if provided
      if (updates) {
        Object.assign(newProductData, updates);
      }
      
      // Assign to new operator
      newProductData.operator = operatorId;
      // Cloned products start as Draft by default unless specified
      newProductData.status = updates?.status || 'Draft';
      
      const newProduct = await Product.create(newProductData);
      return res.status(201).json({ message: 'Produit cloné et assigné avec succès', product: newProduct });
    } else {
      // Reassign and modify existing product
      originalProduct.operator = operatorId;
      if (updates) {
        Object.keys(updates).forEach(key => {
          originalProduct[key] = updates[key];
        });
      }
      await originalProduct.save();
      return res.status(200).json({ message: 'Produit réassigné et modifié avec succès', product: originalProduct });
    }
  } catch (error) {
    logger.error('Assign product error:', error);
    res.status(500).json({ message: 'Failed to assign product' });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const skip = (page - 1) * limit;
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json(users);
  } catch (error) {
    logger.error('Get users error:', error);
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
    logger.error('Delete user error:', error);
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
        logger.error(`Error updating badges for product ${product._id}:`, error.message);
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
        logger.error(`Error updating badges for operator ${operator._id}:`, error.message);
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
    logger.error('Initialize badges error:', error);
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
    logger.error('Create badge error:', error);
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
    logger.error('Get all badges error:', error);
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
    logger.error('Get requestable badges error:', error);
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
        logger.error(`Error assigning badge to product ${productId}:`, error.message);
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
    logger.error('Assign badge to products error:', error);
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
        logger.error(`Error assigning badge to operator ${operatorId}:`, error.message);
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
    logger.error('Assign badge to operators error:', error);
    res.status(500).json({ 
      message: 'Failed to assign badge to operators',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Unassign badge from products
// @route   POST /api/admin/badges/unassign-products
// @access  Private/Admin
const unassignBadgeFromProducts = async (req, res) => {
  try {
    const { badgeId, productIds } = req.body;
    if (!badgeId || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Badge ID and product IDs array are required' });
    }

    let removed = 0;
    for (const productId of productIds) {
      const product = await Product.findById(productId);
      if (!product || !Array.isArray(product.badges)) continue;
      const before = product.badges.length;
      product.badges = product.badges.filter(
        (b) => !(b.badgeId && b.badgeId.toString() === badgeId.toString())
      );
      if (product.badges.length < before) {
        await product.save({ validateBeforeSave: false });
        removed += 1;
      }
    }

    res.json({ message: 'Badge unassignment completed', removed, total: productIds.length });
  } catch (error) {
    logger.error('Unassign badge from products error:', error);
    res.status(500).json({ message: 'Failed to unassign badge from products' });
  }
};

// @desc    Unassign badge from operators
// @route   POST /api/admin/badges/unassign-operators
// @access  Private/Admin
const unassignBadgeFromOperators = async (req, res) => {
  try {
    const { badgeId, operatorIds } = req.body;
    if (!badgeId || !Array.isArray(operatorIds) || operatorIds.length === 0) {
      return res.status(400).json({ message: 'Badge ID and operator IDs array are required' });
    }

    let removed = 0;
    for (const operatorId of operatorIds) {
      const operator = await Operator.findById(operatorId);
      if (!operator || !Array.isArray(operator.badges)) continue;
      const before = operator.badges.length;
      operator.badges = operator.badges.filter(
        (b) => !(b.badgeId && b.badgeId.toString() === badgeId.toString())
      );
      if (operator.badges.length < before) {
        await operator.save({ validateBeforeSave: false });
        removed += 1;
      }
    }

    res.json({ message: 'Badge unassignment completed', removed, total: operatorIds.length });
  } catch (error) {
    logger.error('Unassign badge from operators error:', error);
    res.status(500).json({ message: 'Failed to unassign badge from operators' });
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
    logger.error('Update badge error:', error);
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
    logger.error('Delete badge error:', error);
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
    logger.error('Get products by badge error:', error);
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
      logger.error('Get operators by badge error:', error);
      res.status(500).json({ message: 'Failed to fetch operators for badge' });
    }
  };
  
  // @desc    Get all bookings with PENDING_PAYMENT status
  // @route   GET /api/admin/bookings/pending-payments
  // @access  Private/Admin
  const getPendingPaymentBookings = async (req, res) => {
    try {
      const bookings = await Booking.find({ status: 'PENDING_PAYMENT' })
        .populate({
          path: 'user',
          select: 'name email phone',
        })
        .populate({
          path: 'schedule',
          select: 'date time price',
          populate: {
            path: 'product',
            select: 'title city images category',
          },
        })
        .populate({
          path: 'operator',
          select: 'companyName',
        })
        .sort({ createdAt: -1 });
  
      res.json(bookings);
    } catch (error) {
      logger.error('Get pending payment bookings error:', error);
      res.status(500).json({ message: 'Failed to fetch pending payment bookings' });
    }
  };
  
  // @desc    Confirm offline payment for a booking
  // @route   PUT /api/admin/bookings/:id/confirm-payment
  // @access  Private/Admin
  const confirmPayment = async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id)
        .populate('user', 'name email phone')
        .populate({
          path: 'schedule',
          select: 'date time price',
          populate: {
            path: 'product',
            select: 'title city images',
          },
        })
        .populate('operator', 'companyName user');
  
      if (!booking) {
        return res.status(404).json({ message: 'Réservation introuvable' });
      }
  
      if (booking.status !== 'PENDING_PAYMENT') {
        return res.status(400).json({ message: 'Cette réservation n\'est pas en attente de paiement' });
      }
  
      // Confirm via shared service (idempotent, sets paidAt, no capacity double-decrement)
      const { validateAndConfirmBookingPayment } = await import('../services/bookingPaymentService.js');
      await validateAndConfirmBookingPayment({
        bookingId: booking._id,
        source: 'admin_offline',
        notify: false, // sendBookingConfirmation below
      });
      booking.status = 'Confirmed';
      booking.paymentStatus = 'paid';
      booking.paidAt = booking.paidAt || new Date();
      booking.isHandled = true;
      booking.handledAt = new Date();
      await booking.save();
  
      // Send confirmation email to client
      if (booking.user && booking.user.email) {
        try {
          await sendBookingConfirmation(booking, booking.user);
        } catch (emailError) {
          logger.error('Failed to send confirmation email:', emailError.message);
          // Don't fail the request if email fails
        }
      }
  
      // Populate for response
      const updatedBooking = await Booking.findById(booking._id)
        .populate('user', 'name email phone')
        .populate({
          path: 'schedule',
          select: 'date time price',
          populate: {
            path: 'product',
            select: 'title city images',
          },
        })
        .populate('operator', 'companyName');
  
      res.json({
        message: 'Paiement confirmé avec succès',
        booking: updatedBooking,
      });
    } catch (error) {
      logger.error('Confirm payment error:', error);
      res.status(500).json({ message: 'Failed to confirm payment' });
    }
  };
  
  // @desc    Reject offline payment for a booking
  // @route   PUT /api/admin/bookings/:id/reject-payment
  // @access  Private/Admin
  const rejectPayment = async (req, res) => {
    try {
      const { rejectionReason } = req.body;
  
      if (!rejectionReason || rejectionReason.trim() === '') {
        return res.status(400).json({ message: 'Le motif de rejet est obligatoire' });
      }
  
      const booking = await Booking.findById(req.params.id)
        .populate('user', 'name email phone')
        .populate({
          path: 'schedule',
          select: 'date time price',
          populate: {
            path: 'product',
            select: 'title city images',
          },
        })
        .populate('operator', 'companyName');
  
      if (!booking) {
        return res.status(404).json({ message: 'Réservation introuvable' });
      }
  
      if (booking.status !== 'PENDING_PAYMENT') {
        return res.status(400).json({ message: 'Cette réservation n\'est pas en attente de paiement' });
      }
  
      // Update booking status
      booking.status = 'Cancelled';
      booking.paymentStatus = 'failed';
      booking.cancellationReason = rejectionReason;
      booking.cancelledAt = new Date();
      booking.isHandled = true;
      booking.handledAt = new Date();
      await booking.save();
  
      // Send cancellation email to client
      if (booking.user && booking.user.email) {
        try {
          await sendCancellationEmail(booking, booking.user, {
            reason: rejectionReason,
            refundStatus: 'Not Applicable',
          });
        } catch (emailError) {
          logger.error('Failed to send cancellation email:', emailError.message);
          // Don't fail the request if email fails
        }
      }
  
      // Populate for response
      const updatedBooking = await Booking.findById(booking._id)
        .populate('user', 'name email phone')
        .populate({
          path: 'schedule',
          select: 'date time price',
          populate: {
            path: 'product',
            select: 'title city images',
          },
        })
        .populate('operator', 'companyName');
  
      res.json({
        message: 'Paiement rejeté avec succès',
        booking: updatedBooking,
      });
    } catch (error) {
      logger.error('Reject payment error:', error);
      res.status(500).json({ message: 'Failed to reject payment' });
    }
  };
  
  // @desc    Get analytics data for admin dashboard
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  try {
    const Booking = (await import('../models/bookingModel.js')).default;
    
    // Revenue per month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const revenueByMonthRaw = await Booking.aggregate([
      { 
        $match: { 
          createdAt: { $gte: twelveMonthsAgo },
          status: { $ne: 'Cancelled' }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthsMap = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const revenueByMonth = revenueByMonthRaw.map(item => ({
      name: `${monthsMap[item._id.month - 1]} ${item._id.year}`,
      revenue: item.revenue
    }));

    // Sales by city
    const recentBookings = await Booking.find({ status: { $ne: 'Cancelled' } })
      .populate({
        path: 'schedule',
        populate: { path: 'product', select: 'city' }
      });

    const cityCountMap = {};
    let totalRevenue = 0;
    
    recentBookings.forEach(booking => {
      const city = booking.schedule?.product?.city || 'Autre';
      if (!cityCountMap[city]) cityCountMap[city] = 0;
      cityCountMap[city] += 1;
      totalRevenue += booking.totalPrice || 0;
    });

    const salesByCity = Object.keys(cityCountMap).map(city => ({
      name: city,
      value: cityCountMap[city]
    }));

    const totalBookings = recentBookings.length;
    const averageCart = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    res.json({
      revenueByMonth,
      salesByCity,
      kpis: {
        totalRevenue,
        totalBookings,
        averageCart
      }
    });

  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};

/**
 * [PROMPT-2] Admin bookings list — paginated + filters.
 * Schema fields: user, operator, schedule→product (not userId/productId).
 * @route GET /api/admin/bookings
 */
const getAdminBookings = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const {
      status,
      search,
      productId,
      operatorId,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};

    if (status) {
      const statuses = String(status)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (statuses.length) filter.status = { $in: statuses };
    }

    if (operatorId) {
      filter.operator = operatorId;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      const users = await User.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ],
      })
        .select('_id')
        .lean();
      const userIds = users.map((u) => u._id);
      if (!userIds.length) {
        return res.json({
          bookings: [],
          total: 0,
          page,
          totalPages: 0,
          filters: { status, search, productId, operatorId, dateFrom, dateTo, sortBy, sortOrder },
          stats: await buildBookingStats(),
        });
      }
      filter.user = { $in: userIds };
    }

    if (productId) {
      const schedules = await Schedule.find({ product: productId }).select('_id').lean();
      const scheduleIds = schedules.map((s) => s._id);
      if (!scheduleIds.length) {
        return res.json({
          bookings: [],
          total: 0,
          page,
          totalPages: 0,
          filters: { status, search, productId, operatorId, dateFrom, dateTo, sortBy, sortOrder },
          stats: await buildBookingStats(),
        });
      }
      filter.schedule = { $in: scheduleIds };
    }

    const sortField = sortBy === 'amount' || sortBy === 'totalAmount' ? 'totalAmount' : 'createdAt';
    const sortDir = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;

    const [total, bookings, stats] = await Promise.all([
      Booking.countDocuments(filter),
      Booking.find(filter)
        .populate('user', 'name email phone')
        .populate({
          path: 'schedule',
          select: 'date time price',
          populate: { path: 'product', select: 'title city images' },
        })
        .populate('operator', 'companyName publicName')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .lean(),
      buildBookingStats(),
    ]);

    res.json({
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 0,
      filters: { status, search, productId, operatorId, dateFrom, dateTo, sortBy, sortOrder },
      stats,
    });
  } catch (error) {
    logger.error('Get admin bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
};

const buildBookingStats = async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [total, thisMonth, cancelled, revenueAgg] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ createdAt: { $gte: monthStart } }),
    Booking.countDocuments({ status: 'Cancelled' }),
    Booking.aggregate([
      { $match: { status: { $in: ['Confirmed', 'Pending', 'PENDING_PAYMENT'] } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
    ]),
  ]);
  const revenue = revenueAgg[0]?.revenue || 0;
  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 1000) / 10 : 0;
  return {
    total,
    thisMonth,
    revenue,
    cancellationRate,
    cancelled,
  };
};

/**
 * [PROMPT-2] Admin cancel booking.
 * @route PUT /api/admin/bookings/:id/cancel
 */
const adminCancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'schedule',
        populate: { path: 'product', select: 'title' },
      });

    if (!booking) {
      return res.status(404).json({ message: 'Réservation introuvable' });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cette réservation est déjà annulée' });
    }

    booking.status = 'Cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body?.reason || 'Annulée par l’administrateur';
    await booking.save();

    if (booking.user?.email) {
      try {
        await sendCancellationEmail(booking, booking.user);
      } catch (emailErr) {
        logger.warn('Cancel email failed', { message: emailErr?.message });
      }
    }

    res.json({ message: 'Réservation annulée', booking });
  } catch (error) {
    logger.error('Admin cancel booking error:', error);
    res.status(500).json({ message: 'Failed to cancel booking' });
  }
};

const mapPaymentMethodLabel = (method) => {
  const m = String(method || '').toLowerCase();
  if (m === 'stripe') return 'Stripe';
  if (m === 'paypal') return 'PayPal';
  if (m === 'cmi') return 'CMI';
  if (m === 'bank_transfer' || m === 'cash_pickup' || m === 'cash_delivery') return 'Bank';
  return method ? String(method) : 'Autre';
};

const getCommissionPercent = async () => {
  try {
    const Settings = (await import('../models/settingsModel.js')).default;
    const row = await Settings.findOne({ key: 'platformCommissionPercent' }).lean();
    const value = Number(row?.value);
    if (Number.isFinite(value) && value >= 0) return value;
  } catch {
    /* defaults */
  }
  return 15;
};

/**
 * [PROMPT-8] Finance KPIs + charts for admin finance page
 * GET /api/admin/finance/stats?period=
 */
const getFinanceStats = async (req, res) => {
  try {
    const period = req.query.period || '30d';
    const { start, end } = resolvePeriodRange(period, req.query.dateFrom, req.query.dateTo);
    const commissionPercent = await getCommissionPercent();
    const Withdrawal = (await import('../models/withdrawalModel.js')).default;

    const bookingMatch = {
      createdAt: { $gte: start, $lte: end },
      status: { $ne: 'Cancelled' },
    };

    const [
      revenueAgg,
      paymentBreakdown,
      revenueSeries,
      withdrawalsProcessedAgg,
      withdrawalsPendingAgg,
    ] = await Promise.all([
      Booking.aggregate([
        { $match: bookingMatch },
        {
          $group: {
            _id: null,
            revenue: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } },
            count: { $sum: 1 },
          },
        },
      ]),
      Booking.aggregate([
        { $match: bookingMatch },
        {
          $group: {
            _id: { $ifNull: ['$paymentMethod', 'unknown'] },
            amount: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } },
            count: { $sum: 1 },
          },
        },
        { $sort: { amount: -1 } },
      ]),
      Booking.aggregate([
        { $match: bookingMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Withdrawal.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: { $in: ['Approved', 'Processed'] },
            type: 'operator_payout',
          },
        },
        { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Withdrawal.aggregate([
        {
          $match: {
            status: 'Pending',
            type: 'operator_payout',
          },
        },
        { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const revenue = revenueAgg[0]?.revenue || 0;
    const commissions = Math.round(revenue * (commissionPercent / 100) * 100) / 100;

    // Collapse payment methods into Stripe / PayPal / CMI / Bank
    const pieMap = {};
    for (const row of paymentBreakdown) {
      const label = mapPaymentMethodLabel(row._id);
      if (!pieMap[label]) pieMap[label] = { name: label, amount: 0, count: 0 };
      pieMap[label].amount += row.amount || 0;
      pieMap[label].count += row.count || 0;
    }

    const daySpan = Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));
    const useWeekly = daySpan > 21;
    let revenueChart = revenueSeries.map((d) => ({
      date: d._id,
      label: d._id,
      revenue: d.revenue || 0,
      bookings: d.bookings || 0,
    }));

    if (useWeekly && revenueSeries.length) {
      const weeks = {};
      for (const d of revenueSeries) {
        const dt = new Date(`${d._id}T00:00:00Z`);
        const weekStart = new Date(dt);
        weekStart.setUTCDate(dt.getUTCDate() - dt.getUTCDay());
        const key = weekStart.toISOString().slice(0, 10);
        if (!weeks[key]) weeks[key] = { date: key, label: key, revenue: 0, bookings: 0 };
        weeks[key].revenue += d.revenue || 0;
        weeks[key].bookings += d.bookings || 0;
      }
      revenueChart = Object.values(weeks).sort((a, b) => a.date.localeCompare(b.date));
    }

    res.json({
      period,
      range: { start, end },
      commissionPercent,
      chartGranularity: useWeekly ? 'weekly' : 'daily',
      kpis: {
        revenue,
        commissions,
        withdrawalsProcessedAmount: withdrawalsProcessedAgg[0]?.amount || 0,
        withdrawalsProcessedCount: withdrawalsProcessedAgg[0]?.count || 0,
        withdrawalsPending: {
          count: withdrawalsPendingAgg[0]?.count || 0,
          amount: withdrawalsPendingAgg[0]?.amount || 0,
        },
        bookingsCount: revenueAgg[0]?.count || 0,
      },
      revenueChart,
      paymentMethodBreakdown: Object.values(pieMap),
    });
  } catch (error) {
    logger.error('Get finance stats error:', error);
    res.status(500).json({ message: 'Failed to fetch finance stats' });
  }
};

/**
 * [PROMPT-8] Unified paginated transactions (bookings + withdrawals)
 * GET /api/admin/finance/transactions
 */
const getTransactions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { type, status, paymentMethod, dateFrom, dateTo } = req.query;

    let rangeStart = null;
    let rangeEnd = null;
    if (dateFrom || dateTo) {
      const resolved = resolvePeriodRange('custom', dateFrom, dateTo || dateFrom);
      rangeStart = resolved.start;
      rangeEnd = resolved.end;
    } else if (req.query.period) {
      const resolved = resolvePeriodRange(req.query.period);
      rangeStart = resolved.start;
      rangeEnd = resolved.end;
    }

    const Withdrawal = (await import('../models/withdrawalModel.js')).default;
    const includeBooking = !type || type === 'booking' || type === 'all';
    const includeWithdrawal =
      !type || type === 'withdrawal' || type === 'refund' || type === 'all';

    const rows = [];

    if (includeBooking && type !== 'withdrawal' && type !== 'refund') {
      const bookingQuery = { status: { $ne: 'Cancelled' } };
      if (rangeStart && rangeEnd) {
        bookingQuery.createdAt = { $gte: rangeStart, $lte: rangeEnd };
      }
      if (status) {
        bookingQuery.status = status;
      }
      if (paymentMethod) {
        const pm = String(paymentMethod).toLowerCase();
        if (pm === 'bank') {
          bookingQuery.paymentMethod = { $in: ['bank_transfer', 'cash_pickup', 'cash_delivery'] };
        } else {
          bookingQuery.paymentMethod = pm;
        }
      }

      const bookings = await Booking.find(bookingQuery)
        .populate('operator', 'companyName publicName')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();

      for (const b of bookings) {
        rows.push({
          id: b._id,
          type: 'booking',
          typeLabel: 'Réservation',
          amount: b.totalAmount ?? b.totalPrice ?? 0,
          currency: 'MAD',
          paymentMethod: b.paymentMethod || null,
          paymentMethodLabel: mapPaymentMethodLabel(b.paymentMethod),
          status: b.status,
          date: b.createdAt,
          operator: b.operator?.companyName || b.operator?.publicName || '—',
        });
      }
    }

    if (includeWithdrawal) {
      const wQuery = {};
      if (type === 'withdrawal') wQuery.type = 'operator_payout';
      if (type === 'refund') wQuery.type = { $in: ['client_refund', 'refund'] };
      if (rangeStart && rangeEnd) {
        wQuery.createdAt = { $gte: rangeStart, $lte: rangeEnd };
      }
      if (status) wQuery.status = status;
      if (paymentMethod) {
        const pm = String(paymentMethod).toLowerCase();
        if (pm === 'bank') wQuery.paymentMethod = 'bank_transfer';
        else wQuery.paymentMethod = pm;
      }

      const withdrawals = await Withdrawal.find(wQuery)
        .populate('operator', 'companyName publicName')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();

      for (const w of withdrawals) {
        const isRefund = w.type === 'client_refund' || w.type === 'refund';
        rows.push({
          id: w._id,
          type: isRefund ? 'refund' : 'withdrawal',
          typeLabel: isRefund ? 'Remboursement' : 'Retrait',
          amount: w.amount || 0,
          currency: w.currency || 'MAD',
          paymentMethod: w.paymentMethod || null,
          paymentMethodLabel: mapPaymentMethodLabel(w.paymentMethod),
          status: w.status,
          date: w.createdAt,
          operator:
            w.operator?.companyName ||
            w.operator?.publicName ||
            w.user?.name ||
            '—',
        });
      }
    }

    rows.sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = rows.length;
    const transactions = rows.slice(skip, skip + limit);

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    logger.error('Get finance transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

/**
 * [PROMPT-12] Global admin search across users, products, bookings, operators
 * GET /api/admin/search?q=&type=all|users|products|bookings|operators
 */
const getAdminSearch = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const type = String(req.query.type || 'all').toLowerCase();
    if (q.length < 2) {
      return res.json({ results: [], total: 0, groups: {} });
    }

    const limit = 10;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(escaped, 'i');
    const want = (t) => type === 'all' || type === t || type === `${t}s`;

    const results = [];
    const groups = { users: 0, products: 0, bookings: 0, operators: 0 };

    const tasks = [];

    if (want('user')) {
      tasks.push(
        (async () => {
          const users = await User.find({
            $or: [{ name: rx }, { email: rx }],
          })
            .select('name email role')
            .limit(limit)
            .lean();
          groups.users = users.length;
          for (const u of users) {
            results.push({
              type: 'user',
              id: u._id,
              title: u.name || u.email || 'Utilisateur',
              subtitle: `${u.email || ''}${u.role ? ` · ${u.role}` : ''}`.trim(),
              url: '/admin/users',
            });
          }
        })()
      );
    }

    if (want('product')) {
      tasks.push(
        (async () => {
          const products = await Product.find({
            $or: [{ title: rx }, { description: rx }, { city: rx }],
          })
            .select('title city status')
            .limit(limit)
            .lean();
          groups.products = products.length;
          for (const p of products) {
            results.push({
              type: 'product',
              id: p._id,
              title: p.title || 'Produit',
              subtitle: `${p.city || '—'} · ${p.status || ''}`.trim(),
              url: '/admin/products',
            });
          }
        })()
      );
    }

    if (want('operator')) {
      tasks.push(
        (async () => {
          const emailUsers = await User.find({ email: rx }).select('_id').limit(limit).lean();
          const emailIds = emailUsers.map((u) => u._id);
          const operators = await Operator.find({
            $or: [
              { companyName: rx },
              { publicName: rx },
              ...(emailIds.length ? [{ user: { $in: emailIds } }] : []),
            ],
          })
            .populate('user', 'name email')
            .select('companyName publicName status user')
            .limit(limit)
            .lean();
          groups.operators = operators.length;
          for (const o of operators) {
            results.push({
              type: 'operator',
              id: o._id,
              title: o.companyName || o.publicName || o.user?.name || 'Opérateur',
              subtitle: `${o.user?.email || ''}${o.status ? ` · ${o.status}` : ''}`.trim(),
              url: '/admin/operators',
            });
          }
        })()
      );
    }

    if (want('booking')) {
      tasks.push(
        (async () => {
          const mongoose = (await import('mongoose')).default;
          const or = [];
          if (mongoose.Types.ObjectId.isValid(q) && String(new mongoose.Types.ObjectId(q)) === q) {
            or.push({ _id: q });
          }
          const matchedUsers = await User.find({
            $or: [{ email: rx }, { name: rx }],
          })
            .select('_id')
            .limit(30)
            .lean();
          if (matchedUsers.length) {
            or.push({ user: { $in: matchedUsers.map((u) => u._id) } });
          }
          if (!or.length) {
            groups.bookings = 0;
            return;
          }
          const bookings = await Booking.find({ $or: or })
            .populate('user', 'name email')
            .select('status totalAmount totalPrice createdAt user')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
          groups.bookings = bookings.length;
          for (const b of bookings) {
            const amount = b.totalAmount ?? b.totalPrice ?? 0;
            results.push({
              type: 'booking',
              id: b._id,
              title: `Réservation ${String(b._id).slice(-6)}`,
              subtitle: `${b.user?.email || b.user?.name || '—'} · ${b.status || ''} · ${amount}`,
              url: '/admin/bookings',
            });
          }
        })()
      );
    }

    await Promise.all(tasks);

    // Stable order: users, products, operators, bookings
    const order = { user: 0, product: 1, operator: 2, booking: 3 };
    results.sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9));

    res.json({
      results,
      total: results.length,
      groups,
    });
  } catch (error) {
    logger.error('Admin search error:', error);
    res.status(500).json({ message: 'Failed to search' });
  }
};

export {
  getAdminStats,
  getOperators,
  updateOperator,
  updateOperatorStatus, 
  getProducts,
  updateProductStatus, 
  assignProductToOperator,
  getUsers, 
  deleteUser,
  initializeBadgesAndFlags,
  createBadge,
  getAllBadges,
  getRequestableBadges,
  assignBadgeToProducts,
  assignBadgeToOperators,
  unassignBadgeFromProducts,
  unassignBadgeFromOperators,
  updateBadge,
  deleteBadge,
  getProductsByBadge,
  getOperatorsByBadge,
  getPendingPaymentBookings,
  confirmPayment,
  rejectPayment,
  getAnalytics,
  getAdminBookings,
  adminCancelBooking,
  getFinanceStats,
  getTransactions,
  getAdminSearch,
};
