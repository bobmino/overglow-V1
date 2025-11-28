import Review from '../models/reviewModel.js';
import Booking from '../models/bookingModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import Settings from '../models/settingsModel.js';
import { validationResult } from 'express-validator';
import { notifyReviewPending, notifyReviewApproved } from '../utils/notificationService.js';

// @desc    Create a review
// @route   POST /api/products/:productId/reviews
// @access  Private
const createReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rating, comment } = req.body;
  const productId = req.params.productId;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if user has booked this product and status is confirmed
  // We need to find bookings for this user that are linked to schedules of this product
  const bookings = await Booking.find({ user: req.user._id, status: 'Confirmed' })
    .populate({
      path: 'schedule',
      match: { product: productId },
    });
  
  const hasBooked = bookings.some(booking => booking.schedule !== null);

  if (!hasBooked) {
    res.status(400);
    throw new Error('You can only review products you have booked');
  }

  const alreadyReviewed = await Review.findOne({
    product: productId,
    user: req.user._id,
  });

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('Product already reviewed');
  }

  // Check auto-approval settings
  const user = await User.findById(req.user._id);
  const autoApproveSetting = await Settings.findOne({ key: 'autoApproveReviews' });
  const autoApprove = autoApproveSetting ? autoApproveSetting.value : false;
  
  let reviewStatus = 'Pending';
  if (autoApprove && user.isApproved) {
    reviewStatus = 'Approved';
  }

  const review = new Review({
    product: productId,
    user: req.user._id,
    rating,
    comment,
    status: reviewStatus,
    approvedAt: reviewStatus === 'Approved' ? new Date() : undefined,
  });

  await review.save();
  
  // Notify admin if review is pending
  if (reviewStatus === 'Pending') {
    const admins = await User.find({ role: 'Admin' });
    const adminIds = admins.map(admin => admin._id);
    await notifyReviewPending(review, adminIds);
  }
  
  res.status(201).json({ message: 'Review added', review });
};

// @desc    Approve a review
// @route   PUT /api/reviews/:id/approve
// @access  Private/Admin
const approveReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    review.status = 'Approved';
    review.approvedAt = new Date();
    await review.save();
    
    // Notify user that their review was approved
    await notifyReviewApproved(review, review.user);
    
    res.json(review);
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({ message: 'Failed to approve review' });
  }
};

// @desc    Reject a review
// @route   PUT /api/reviews/:id/reject
// @access  Private/Admin
const rejectReview = async (req, res) => {
  try {
    const { reason } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    review.status = 'Rejected';
    review.rejectedAt = new Date();
    review.rejectionReason = reason || '';
    await review.save();
    
    res.json(review);
  } catch (error) {
    console.error('Reject review error:', error);
    res.status(500).json({ message: 'Failed to reject review' });
  }
};

// @desc    Get product reviews
// @route   GET /api/products/:productId/reviews
// @access  Public
const getProductReviews = async (req, res) => {
  // Only show approved reviews to public
  const reviews = await Review.find({ 
    product: req.params.productId,
    status: 'Approved'
  }).populate('user', 'name').sort({ createdAt: -1 });
  res.json(reviews);
};

export { createReview, getProductReviews, approveReview, rejectReview };
