import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getOperatorBookings,
  getOperatorAnalytics,
  getOperatorDashboardStats,
  getOperatorAccount,
  updateOperatorAccount,
} from '../controllers/operatorController.js';

const router = express.Router();

router.get('/bookings', protect, authorize('Opérateur'), getOperatorBookings);
router.get('/analytics', protect, authorize('Opérateur'), getOperatorAnalytics);
router.get('/dashboard-stats', protect, authorize('Opérateur'), getOperatorDashboardStats);
router.get('/account', protect, authorize('Opérateur'), getOperatorAccount);
router.put('/account', protect, authorize('Opérateur'), updateOperatorAccount);

export default router;
