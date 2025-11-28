import express from 'express';
import { check } from 'express-validator';
import {
  createInquiry,
  getMyInquiries,
  getOperatorInquiries,
  answerInquiry,
  approveInquiry,
  rejectInquiry,
} from '../controllers/inquiryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/',
  protect,
  [
    check('productId', 'Product ID is required').not().isEmpty(),
  ],
  createInquiry
);

router.get('/my-inquiries', protect, getMyInquiries);

router.get('/operator', protect, authorize('Opérateur'), getOperatorInquiries);

router.put(
  '/:id/answer',
  protect,
  authorize('Opérateur'),
  [
    check('answer', 'Answer is required').not().isEmpty(),
  ],
  answerInquiry
);

router.put('/:id/approve', protect, authorize('Opérateur'), approveInquiry);

router.put(
  '/:id/reject',
  protect,
  authorize('Opérateur'),
  [
    check('reason', 'Rejection reason is required').not().isEmpty(),
  ],
  rejectInquiry
);

export default router;

