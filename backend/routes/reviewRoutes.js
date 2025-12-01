import express from 'express';
import { 
  approveReview, 
  rejectReview,
  voteReview,
  addOperatorResponse,
  reportReview,
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/:id/approve', protect, authorize('Admin'), approveReview);
router.put('/:id/reject', protect, authorize('Admin'), rejectReview);
router.post('/:id/vote', protect, voteReview);
router.post('/:id/response', protect, authorize('Opérateur'), addOperatorResponse);
router.post('/:id/report', protect, reportReview);

export default router;

