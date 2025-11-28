import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getOperatorBookings, getOperatorAnalytics } from '../controllers/operatorController.js';

const router = express.Router();

router.get('/bookings', protect, authorize('Opérateur'), getOperatorBookings);
router.get('/analytics', protect, authorize('Opérateur'), getOperatorAnalytics);

export default router;
