import BadgeRequest from '../models/badgeRequestModel.js';
import Product from '../models/productModel.js';
import Operator from '../models/operatorModel.js';
import Badge from '../models/badgeModel.js';
import { updateProductMetrics } from '../utils/badgeService.js';
import { notifyBadgeRequestSubmitted, notifyBadgeRequestApproved, notifyBadgeRequestRejected } from '../utils/notificationService.js';

// @desc    Create a badge request for a product
// @route   POST /api/badge-requests
// @access  Private/Operator
const createBadgeRequest = async (req, res) => {
  try {
    const { productId, badgeId, justification, evidence, requestedFlags } = req.body;

    if (!productId || !badgeId || !justification) {
      return res.status(400).json({ 
        message: 'Product ID, Badge ID, and justification are required' 
      });
    }

    // Verify operator owns the product
    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.operator.toString() !== operator._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to request badge for this product' });
    }

    // Verify badge exists and is manual (not automatic)
    const badge = await Badge.findById(badgeId);
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }

    if (badge.isAutomatic) {
      return res.status(400).json({ 
        message: 'This badge is automatic and does not require approval' 
      });
    }

    // Check if request already exists
    const existingRequest = await BadgeRequest.findOne({ 
      product: productId, 
      badge: badgeId 
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ 
          message: 'A pending request for this badge already exists' 
        });
      }
      if (existingRequest.status === 'approved') {
        return res.status(400).json({ 
          message: 'This badge has already been approved for this product' 
        });
      }
      // If rejected, allow new request
    }

    // Create badge request
    const badgeRequest = await BadgeRequest.create({
      operator: operator._id,
      product: productId,
      badge: badgeId,
      justification,
      evidence: evidence || {},
      requestedFlags: requestedFlags || {},
      status: 'pending',
    });

    // Notify admins
    await notifyBadgeRequestSubmitted(badgeRequest, product, badge);

    res.status(201).json(badgeRequest);
  } catch (error) {
    console.error('Create badge request error:', error);
    res.status(500).json({ 
      message: 'Failed to create badge request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get badge requests for operator's products
// @route   GET /api/badge-requests/my-requests
// @access  Private/Operator
const getMyBadgeRequests = async (req, res) => {
  try {
    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    const requests = await BadgeRequest.find({ operator: operator._id })
      .populate('product', 'title')
      .populate('badge', 'name icon color description')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get my badge requests error:', error);
    res.status(500).json({ message: 'Failed to fetch badge requests' });
  }
};

// @desc    Get all pending badge requests (admin)
// @route   GET /api/badge-requests/pending
// @access  Private/Admin
const getPendingBadgeRequests = async (req, res) => {
  try {
    const requests = await BadgeRequest.find({ status: 'pending' })
      .populate('operator', 'companyName publicName')
      .populate('product', 'title images category city')
      .populate('badge', 'name icon color description type')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get pending badge requests error:', error);
    res.status(500).json({ message: 'Failed to fetch pending badge requests' });
  }
};

// @desc    Approve a badge request
// @route   PUT /api/badge-requests/:id/approve
// @access  Private/Admin
const approveBadgeRequest = async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const badgeRequest = await BadgeRequest.findById(req.params.id)
      .populate('product')
      .populate('badge')
      .populate('operator');

    if (!badgeRequest) {
      return res.status(404).json({ message: 'Badge request not found' });
    }

    if (badgeRequest.status !== 'pending') {
      return res.status(400).json({ 
        message: `Badge request is already ${badgeRequest.status}` 
      });
    }

    // Update product authenticity flags
    const product = await Product.findById(badgeRequest.product._id);
    if (product) {
      // Merge requested flags with existing authenticity
      product.authenticity = {
        ...product.authenticity,
        ...badgeRequest.requestedFlags,
      };
      await product.save({ validateBeforeSave: false });

      // Update badges
      await updateProductMetrics(product._id);
    }

    // Update badge request
    badgeRequest.status = 'approved';
    badgeRequest.reviewedBy = req.user._id;
    badgeRequest.reviewedAt = new Date();
    if (adminNotes) {
      badgeRequest.adminNotes = adminNotes;
    }
    await badgeRequest.save();

    // Notify operator
    const operator = await Operator.findById(badgeRequest.operator._id);
    if (operator && operator.user) {
      await notifyBadgeRequestApproved(badgeRequest, operator.user);
    }

    res.json(badgeRequest);
  } catch (error) {
    console.error('Approve badge request error:', error);
    res.status(500).json({ 
      message: 'Failed to approve badge request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Reject a badge request
// @route   PUT /api/badge-requests/:id/reject
// @access  Private/Admin
const rejectBadgeRequest = async (req, res) => {
  try {
    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const badgeRequest = await BadgeRequest.findById(req.params.id)
      .populate('operator');

    if (!badgeRequest) {
      return res.status(404).json({ message: 'Badge request not found' });
    }

    if (badgeRequest.status !== 'pending') {
      return res.status(400).json({ 
        message: `Badge request is already ${badgeRequest.status}` 
      });
    }

    // Update badge request
    badgeRequest.status = 'rejected';
    badgeRequest.reviewedBy = req.user._id;
    badgeRequest.reviewedAt = new Date();
    badgeRequest.rejectionReason = rejectionReason;
    if (adminNotes) {
      badgeRequest.adminNotes = adminNotes;
    }
    await badgeRequest.save();

    // Notify operator
    const operator = await Operator.findById(badgeRequest.operator._id);
    if (operator && operator.user) {
      await notifyBadgeRequestRejected(badgeRequest, operator.user, rejectionReason);
    }

    res.json(badgeRequest);
  } catch (error) {
    console.error('Reject badge request error:', error);
    res.status(500).json({ 
      message: 'Failed to reject badge request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export {
  createBadgeRequest,
  getMyBadgeRequests,
  getPendingBadgeRequests,
  approveBadgeRequest,
  rejectBadgeRequest,
};

