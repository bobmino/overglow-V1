import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getOperatorBookings, getOperatorAnalytics, getOperatorDashboardStats } from '../controllers/operatorController.js';

const router = express.Router();

router.get('/bookings', protect, authorize('Opérateur'), getOperatorBookings);
router.get('/analytics', protect, authorize('Opérateur'), getOperatorAnalytics);
router.get('/dashboard-stats', protect, authorize('Opérateur'), getOperatorDashboardStats);

export default router;
