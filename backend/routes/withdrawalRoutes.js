import express from 'express';
import { check } from 'express-validator';
import {
  getOperatorBalance,
  createWithdrawal,
  getMyWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  processWithdrawal,
} from '../controllers/withdrawalController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/balance', authorize('Opérateur'), getOperatorBalance);
router.get('/my-withdrawals', getMyWithdrawals);
router.get('/', authorize('Admin'), getAllWithdrawals);

router.post('/', [
  check('amount', 'Amount is required').not().isEmpty(),
  check('amount', 'Amount must be a positive number').isFloat({ min: 0.01 }),
  check('type', 'Type must be operator_payout or client_refund').isIn(['operator_payout', 'client_refund']),
  check('paymentMethod', 'Payment method is required').not().isEmpty(),
], createWithdrawal);

router.put('/:id/approve', authorize('Admin'), approveWithdrawal);
router.put('/:id/reject', authorize('Admin'), [
  check('reason', 'Rejection reason is required').optional(),
], rejectWithdrawal);
router.put('/:id/process', authorize('Admin'), processWithdrawal);

export default router;

