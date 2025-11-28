import ApprovalRequest from '../models/approvalRequestModel.js';
import Product from '../models/productModel.js';
import Review from '../models/reviewModel.js';
import Operator from '../models/operatorModel.js';
import User from '../models/userModel.js';
import { validationResult } from 'express-validator';
import { notifyApprovalRequest } from '../utils/notificationService.js';

// @desc    Create approval request
// @route   POST /api/approval-requests
// @access  Private
const createApprovalRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { entityType, entityId, message } = req.body;

    // Check if entity exists
    let entity;
    switch (entityType) {
      case 'Product':
        entity = await Product.findById(entityId);
        break;
      case 'Review':
        entity = await Review.findById(entityId);
        break;
      case 'Operator':
        entity = await Operator.findById(entityId);
        break;
      default:
        return res.status(400).json({ message: 'Invalid entity type' });
    }

    if (!entity) {
      return res.status(404).json({ message: `${entityType} not found` });
    }

    // Check if user already requested approval for this entity (unique constraint)
    const existingRequest = await ApprovalRequest.findOne({
      user: req.user._id,
      entityType,
      entityId,
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: 'You have already requested approval for this item. Please wait for admin response.' 
      });
    }

    // Check if approval is needed (only for Pending items)
    let needsApproval = false;
    if (entityType === 'Product' && entity.status === 'Pending Review') {
      needsApproval = true;
    } else if (entityType === 'Review' && entity.status === 'Pending') {
      needsApproval = true;
    } else if (entityType === 'Operator' && entity.status === 'Pending') {
      needsApproval = true;
    }

    if (!needsApproval) {
      return res.status(400).json({ 
        message: 'This item does not require approval or has already been processed' 
      });
    }

    // Check delay: only allow request if item has been pending for more than X days (default 3)
    const delayDays = parseInt(process.env.APPROVAL_REQUEST_DELAY_DAYS || '3');
    const entityCreatedAt = entity.createdAt || new Date();
    const daysSinceCreation = (new Date() - new Date(entityCreatedAt)) / (1000 * 60 * 60 * 24);

    if (daysSinceCreation < delayDays) {
      return res.status(400).json({ 
        message: `You can only request approval after ${delayDays} days of waiting. Please wait ${Math.ceil(delayDays - daysSinceCreation)} more day(s).` 
      });
    }

    const approvalRequest = new ApprovalRequest({
      user: req.user._id,
      entityType,
      entityId,
      message: message || '',
      status: 'pending',
    });

    const createdRequest = await approvalRequest.save();

    // Notify all admins
    const admins = await User.find({ role: 'Admin' });
    const adminIds = admins.map(admin => admin._id);
    await notifyApprovalRequest(createdRequest, adminIds);

    res.status(201).json(createdRequest);
  } catch (error) {
    console.error('Create approval request error:', error);
    if (error.code === 11000) {
      // Duplicate key error (unique constraint)
      return res.status(400).json({ 
        message: 'You have already requested approval for this item' 
      });
    }
    res.status(500).json({ message: 'Failed to create approval request' });
  }
};

// @desc    Get my approval requests
// @route   GET /api/approval-requests/my-requests
// @access  Private
const getMyApprovalRequests = async (req, res) => {
  try {
    const requests = await ApprovalRequest.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('entityId', 'title name companyName status');

    res.json(requests);
  } catch (error) {
    console.error('Get my approval requests error:', error);
    res.status(500).json({ message: 'Failed to fetch approval requests' });
  }
};

// @desc    Get all approval requests (admin)
// @route   GET /api/approval-requests
// @access  Private/Admin
const getAllApprovalRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const requests = await ApprovalRequest.find(query)
      .populate('user', 'name email')
      .populate('entityId')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get all approval requests error:', error);
    res.status(500).json({ message: 'Failed to fetch approval requests' });
  }
};

// @desc    Approve request and approve the related entity
// @route   PUT /api/approval-requests/:id/approve
// @access  Private/Admin
const approveRequest = async (req, res) => {
  try {
    const request = await ApprovalRequest.findById(req.params.id)
      .populate('entityId')
      .populate('user');

    if (!request) {
      return res.status(404).json({ message: 'Approval request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    // Approve the related entity based on type
    let entity;
    switch (request.entityType) {
      case 'Product':
        entity = await Product.findById(request.entityId);
        if (entity && entity.status === 'Pending Review') {
          entity.status = 'Published';
          await entity.save();
        }
        break;
      case 'Review':
        entity = await Review.findById(request.entityId);
        if (entity && entity.status === 'Pending') {
          entity.status = 'Approved';
          entity.approvedAt = new Date();
          await entity.save();
        }
        break;
      case 'Operator':
        entity = await Operator.findById(request.entityId);
        if (entity && entity.status === 'Pending') {
          entity.status = 'Active';
          await entity.save();
          // Also approve the user
          const user = await User.findById(entity.user);
          if (user) {
            user.isApproved = true;
            user.approvedAt = new Date();
            await user.save();
          }
        }
        break;
    }

    // Update request status
    request.status = 'approved';
    request.respondedAt = new Date();
    await request.save();

    res.json({ request, entity });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ message: 'Failed to approve request' });
  }
};

// @desc    Reject approval request
// @route   PUT /api/approval-requests/:id/reject
// @access  Private/Admin
const rejectRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await ApprovalRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Approval request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    request.status = 'rejected';
    request.respondedAt = new Date();
    request.message = reason ? `${request.message || ''}\n\nRejection reason: ${reason}` : request.message;
    await request.save();

    res.json(request);
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ message: 'Failed to reject request' });
  }
};

export {
  createApprovalRequest,
  getMyApprovalRequests,
  getAllApprovalRequests,
  approveRequest,
  rejectRequest,
};

