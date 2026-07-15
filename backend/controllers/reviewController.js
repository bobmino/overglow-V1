import Review from '../models/reviewModel.js';
import Booking from '../models/bookingModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import Operator from '../models/operatorModel.js';
import Settings from '../models/settingsModel.js';
import { validationResult } from 'express-validator';
import { notifyReviewPending, notifyReviewApproved, notifyNewReview, notifyLowRating } from '../utils/notificationService.js';
import { sendReviewNotificationEmail } from '../utils/emailService.js';
import { logger } from '../utils/logger.js';
import { sanitizeText } from '../utils/sanitizer.js';

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

  // Check if booking exists (for verified review)
  const hasConfirmedBooking = bookings.some(booking => booking.status === 'Confirmed');
  
  const review = new Review({
    product: productId,
    user: req.user._id,
    rating,
    comment: sanitizeText(comment || ''),
    status: reviewStatus,
    approvedAt: reviewStatus === 'Approved' ? new Date() : undefined,
    isVerified: hasConfirmedBooking,
    photos: req.body.photos || [], // Photos from frontend
  });

  await review.save();
  
  // Update product and operator metrics (async, don't wait)
  const { updateProductMetrics, updateOperatorMetrics } = await import('../utils/badgeService.js');
  updateProductMetrics(productId).catch(err => logger.error('Error updating product metrics:', err));
  if (product.operator) {
    updateOperatorMetrics(product.operator).catch(err => logger.error('Error updating operator metrics:', err));
  }

  // Notify operator of new review (+ low rating alert)
  if (product.operator) {
    try {
      const operatorDoc = await Operator.findById(product.operator).select('user');
      if (operatorDoc?.user) {
        await notifyNewReview(review, product, operatorDoc.user);
        if (Number(rating) <= 2) {
          await notifyLowRating(review, product, operatorDoc.user);
        }
        const operatorUser = await User.findById(operatorDoc.user).select('name email preferredLanguage locale');
        if (operatorUser) {
          sendReviewNotificationEmail({
            operatorUser,
            product,
            review: { ...review.toObject?.() || review, user: req.user },
          }).catch((err) => logger.error('Review email failed:', err));
        }
      }
    } catch (err) {
      logger.error('Error notifying operator of new review:', err);
    }
  }
  
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
    logger.error('Approve review error:', error);
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
    logger.error('Reject review error:', error);
    res.status(500).json({ message: 'Failed to reject review' });
  }
};

// @desc    Get product reviews
// @route   GET /api/products/:productId/reviews
// @access  Public
const getProductReviews = async (req, res) => {
  try {
    const { filter, sort } = req.query;
    let query = { 
      product: req.params.productId,
      status: 'Approved'
    };
    
    // Filters
    if (filter === 'with-photos') {
      query.photos = { $exists: true, $ne: [] };
    } else if (filter === 'verified') {
      query.isVerified = true;
    }
    
    let reviews = await Review.find(query)
      .populate('user', 'name')
      .populate('operatorResponse.respondedBy', 'name');
    
    // Sorting
    if (sort === 'helpful') {
      reviews.sort((a, b) => (b.helpfulVotes || 0) - (a.helpfulVotes || 0));
    } else if (sort === 'recent') {
      reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'rating') {
      reviews.sort((a, b) => b.rating - a.rating);
    } else {
      // Default: most helpful first
      reviews.sort((a, b) => (b.helpfulVotes || 0) - (a.helpfulVotes || 0));
    }

    // Rating breakdown (all approved reviews for this product, independent of filter)
    const allApproved = await Review.find({
      product: req.params.productId,
      status: 'Approved',
    }).select('rating').lean();

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    for (const r of allApproved) {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0)));
      counts[star] += 1;
      sum += star;
    }
    const total = allApproved.length;
    const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
    const percentages = {};
    for (let s = 1; s <= 5; s += 1) {
      percentages[s] = total > 0 ? Math.round((counts[s] / total) * 1000) / 10 : 0;
    }

    res.json({
      reviews,
      breakdown: {
        average,
        total,
        counts,
        percentages,
      },
    });
  } catch (error) {
    logger.error('Get product reviews error:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

// @desc    Vote helpful/not helpful on a review
// @route   POST /api/reviews/:id/vote
// @access  Private
const voteReview = async (req, res) => {
  try {
    const { helpful } = req.body; // true for helpful, false for not helpful
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    const userId = req.user._id.toString();
    const helpfulVoters = review.helpfulVoters.map(v => v.toString());
    const notHelpfulVoters = review.notHelpfulVoters.map(v => v.toString());
    
    // Remove from opposite list if exists
    if (helpful) {
      if (notHelpfulVoters.includes(userId)) {
        review.notHelpfulVoters = review.notHelpfulVoters.filter(
          v => v.toString() !== userId
        );
      }
      if (!helpfulVoters.includes(userId)) {
        review.helpfulVoters.push(req.user._id);
        review.helpfulVotes = (review.helpfulVotes || 0) + 1;
      }
    } else {
      if (helpfulVoters.includes(userId)) {
        review.helpfulVoters = review.helpfulVoters.filter(
          v => v.toString() !== userId
        );
        review.helpfulVotes = Math.max(0, (review.helpfulVotes || 0) - 1);
      }
      if (!notHelpfulVoters.includes(userId)) {
        review.notHelpfulVoters.push(req.user._id);
      }
    }
    
    await review.save();
    res.json({ helpfulVotes: review.helpfulVotes, review });
  } catch (error) {
    logger.error('Vote review error:', error);
    res.status(500).json({ message: 'Failed to vote on review' });
  }
};

// @desc    Add operator (or admin) response to a review
// @route   POST /api/reviews/:id/response | POST /api/reviews/:id/reply
// @access  Private/Operator|Admin
const addOperatorResponse = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'Le message de réponse est requis' });
    }

    const review = await Review.findById(req.params.id).populate('product');
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const role = String(req.user.role || '').toLowerCase();
    const isAdmin = ['admin', 'administrator', 'superadmin'].includes(role);
    
    if (!isAdmin) {
      const operator = await Operator.findOne({ user: req.user._id });
      if (!operator || review.product.operator.toString() !== operator._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to respond to this review' });
      }
    }
    
    review.operatorResponse = {
      message: sanitizeText(String(message).trim()),
      respondedAt: new Date(),
      respondedBy: req.user._id,
    };
    
    await review.save();
    res.json(review);
  } catch (error) {
    logger.error('Add operator response error:', error);
    res.status(500).json({ message: 'Failed to add response' });
  }
};

/**
 * [PROMPT-11] Admin list reviews (paginated + filters)
 * GET /api/admin/reviews
 */
const getAdminReviews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { rating, status, productId, operatorId, search } = req.query;

    const filter = {};
    if (status) {
      const statuses = String(status)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (statuses.length === 1) filter.status = statuses[0];
      else if (statuses.length > 1) filter.status = { $in: statuses };
    }
    if (rating) filter.rating = Number(rating);
    if (productId) filter.product = productId;

    let productIdsForOperator = null;
    if (operatorId) {
      const products = await Product.find({ operator: operatorId }).select('_id').lean();
      productIdsForOperator = products.map((p) => p._id);
      filter.product = { $in: productIdsForOperator };
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      const products = await Product.find({
        title: { $regex: q, $options: 'i' },
        ...(productIdsForOperator ? { _id: { $in: productIdsForOperator } } : {}),
      })
        .select('_id')
        .lean();
      const ids = products.map((p) => p._id);
      filter.product = { $in: ids.length ? ids : [] };
    }

    const [reviews, total, pendingCount, avgAgg] = await Promise.all([
      Review.find(filter)
        .populate('user', 'name email')
        .populate({
          path: 'product',
          select: 'title city operator',
          populate: { path: 'operator', select: 'companyName publicName' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
      Review.countDocuments({ status: 'Pending' }),
      Review.aggregate([
        { $match: { status: 'Approved' } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      stats: {
        averageRating: Math.round((avgAgg[0]?.avg || 0) * 10) / 10,
        totalApproved: avgAgg[0]?.count || 0,
        pendingModeration: pendingCount,
      },
    });
  } catch (error) {
    logger.error('Get admin reviews error:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

/**
 * [PROMPT-11] Admin set review status (approve / reject)
 * PUT /api/admin/reviews/:id/status
 */
const updateAdminReviewStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const next = String(status || '').trim();
    if (!['Approved', 'Rejected', 'Pending'].includes(next)) {
      return res.status(400).json({
        message: 'Statut invalide (Approved | Rejected | Pending)',
      });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.status = next;
    if (next === 'Approved') {
      review.approvedAt = new Date();
      review.rejectedAt = undefined;
      await review.save();
      await notifyReviewApproved(review, review.user);
    } else if (next === 'Rejected') {
      review.rejectedAt = new Date();
      review.rejectionReason = reason || '';
      await review.save();
    } else {
      await review.save();
    }

    res.json({ message: 'Statut mis à jour', review });
  } catch (error) {
    logger.error('Update admin review status error:', error);
    res.status(500).json({ message: 'Failed to update review status' });
  }
};

// @desc    Report a review as inappropriate
// @route   POST /api/reviews/:id/report
// @access  Private
const reportReview = async (req, res) => {
  try {
    const { reason, description } = req.body;
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user already reported this review
    const userId = req.user._id.toString();
    const alreadyReported = review.reports?.some(
      r => r.reportedBy.toString() === userId && r.status === 'pending'
    );
    
    if (alreadyReported) {
      return res.status(400).json({ message: 'You have already reported this review' });
    }
    
    // Add report
    if (!review.reports) {
      review.reports = [];
    }
    
    review.reports.push({
      reportedBy: req.user._id,
      reason: reason || 'other',
      description: description || '',
      reportedAt: new Date(),
      status: 'pending',
    });
    
    review.reportCount = (review.reportCount || 0) + 1;
    await review.save();
    
    // If report count reaches threshold (e.g., 5), auto-hide review
    const REPORT_THRESHOLD = 5;
    if (review.reportCount >= REPORT_THRESHOLD) {
      review.status = 'Pending'; // Put back to pending for admin review
      await review.save();
    }
    
    res.json({ message: 'Review reported successfully', reportCount: review.reportCount });
  } catch (error) {
    logger.error('Report review error:', error);
    res.status(500).json({ message: 'Failed to report review' });
  }
};

export { 
  createReview, 
  getProductReviews, 
  approveReview, 
  rejectReview,
  voteReview,
  addOperatorResponse,
  reportReview,
  getAdminReviews,
  updateAdminReviewStatus,
};
