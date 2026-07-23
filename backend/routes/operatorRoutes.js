import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getOperatorBookings,
  getOperatorAnalytics,
  getOperatorDashboardStats,
  getOperatorAccount,
  updateOperatorAccount,
} from '../controllers/operatorController.js';
import {
  getAdvancedAnalytics,
  exportAnalyticsCSV,
} from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/bookings', protect, authorize('Opérateur'), getOperatorBookings);
router.get('/analytics', protect, authorize('Opérateur'), getOperatorAnalytics);
router.get('/analytics/advanced', protect, authorize('Opérateur'), getAdvancedAnalytics);
router.get('/analytics/export/csv', protect, authorize('Opérateur'), exportAnalyticsCSV);
router.get('/dashboard-stats', protect, authorize('Opérateur'), getOperatorDashboardStats);
router.get('/account', protect, authorize('Opérateur'), getOperatorAccount);
router.put('/account', protect, authorize('Opérateur'), updateOperatorAccount);

export default router;
