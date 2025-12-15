import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getOperatorBookings, getOperatorAnalytics } from '../controllers/operatorController.js';
import { getAdvancedAnalytics, exportAnalyticsCSV } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/bookings', protect, authorize('Opérateur'), getOperatorBookings);
router.get('/analytics', protect, authorize('Opérateur'), getOperatorAnalytics);
router.get('/analytics/advanced', protect, authorize('Opérateur'), getAdvancedAnalytics);
router.get('/analytics/export/csv', protect, authorize('Opérateur'), exportAnalyticsCSV);

export default router;
