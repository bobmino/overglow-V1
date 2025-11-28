import express from 'express';
import { approveReview, rejectReview } from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/:id/approve', protect, authorize('Admin'), approveReview);
router.put('/:id/reject', protect, authorize('Admin'), rejectReview);

export default router;

