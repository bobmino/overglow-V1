import express from 'express';
import { check } from 'express-validator';
import {
  createApprovalRequest,
  getMyApprovalRequests,
  getAllApprovalRequests,
  approveRequest,
  rejectRequest,
} from '../controllers/approvalRequestController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', [
  check('entityType', 'Entity type is required').isIn(['Product', 'Review', 'Operator']),
  check('entityId', 'Entity ID is required').not().isEmpty(),
  check('message', 'Message must be a string').optional().isString(),
], createApprovalRequest);

router.get('/my-requests', getMyApprovalRequests);
router.get('/', authorize('Admin'), getAllApprovalRequests);

router.put('/:id/approve', authorize('Admin'), approveRequest);
router.put('/:id/reject', authorize('Admin'), [
  check('reason', 'Rejection reason must be a string').optional().isString(),
], rejectRequest);

export default router;

