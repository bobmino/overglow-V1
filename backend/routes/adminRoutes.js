import express from 'express';
import {
  getAdminStats,
  getOperators,
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
} from '../controllers/adminController.js';
import {
  getAdminReviews,
  updateAdminReviewStatus,
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, authorize('Admin'), getAdminStats);
router.get('/search', protect, authorize('Admin'), getAdminSearch);
router.get('/finance/stats', protect, authorize('Admin'), getFinanceStats);
router.get('/finance/transactions', protect, authorize('Admin'), getTransactions);
router.get('/reviews', protect, authorize('Admin'), getAdminReviews);
router.put('/reviews/:id/status', protect, authorize('Admin'), updateAdminReviewStatus);
router.get('/analytics', protect, authorize('Admin'), getAnalytics);
router.get('/operators', protect, authorize('Admin'), getOperators);
router.put('/operators/:id/status', protect, authorize('Admin'), updateOperatorStatus);
router.get('/products', protect, authorize('Admin'), getProducts);
router.put('/products/:id/status', protect, authorize('Admin'), updateProductStatus);
router.post('/products/:id/assign', protect, authorize('Admin'), assignProductToOperator);
router.get('/users', protect, authorize('Admin'), getUsers);
router.delete('/users/:id', protect, authorize('Admin'), deleteUser);
router.post('/initialize-badges', protect, authorize('Admin'), initializeBadgesAndFlags);

// Badge management routes
router.post('/badges', protect, authorize('Admin'), createBadge);
router.get('/badges', protect, authorize('Admin'), getAllBadges);
router.get('/badges/requestable', protect, authorize('Admin'), getRequestableBadges);
router.post('/badges/assign-products', protect, authorize('Admin'), assignBadgeToProducts);
router.post('/badges/assign-operators', protect, authorize('Admin'), assignBadgeToOperators);
router.put('/badges/:id', protect, authorize('Admin'), updateBadge);
router.delete('/badges/:id', protect, authorize('Admin'), deleteBadge);
router.get('/badges/:id/products', protect, authorize('Admin'), getProductsByBadge);
router.get('/badges/:id/operators', protect, authorize('Admin'), getOperatorsByBadge);

// [PROMPT-2] Bookings management
router.get('/bookings', protect, authorize('Admin'), getAdminBookings);
router.get('/bookings/pending-payments', protect, authorize('Admin'), getPendingPaymentBookings);
router.put('/bookings/:id/confirm-payment', protect, authorize('Admin'), confirmPayment);
router.put('/bookings/:id/reject-payment', protect, authorize('Admin'), rejectPayment);
router.put('/bookings/:id/cancel', protect, authorize('Admin'), adminCancelBooking);

export default router;
