import express from 'express';
import {
  createBadgeRequest,
  getMyBadgeRequests,
  getPendingBadgeRequests,
  approveBadgeRequest,
  rejectBadgeRequest,
} from '../controllers/badgeRequestController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Operator routes
router.post('/', protect, authorize('Opérateur', 'Admin'), createBadgeRequest);
router.get('/my-requests', protect, authorize('Opérateur', 'Admin'), getMyBadgeRequests);

// Admin routes
router.get('/pending', protect, authorize('Admin'), getPendingBadgeRequests);
router.put('/:id/approve', protect, authorize('Admin'), approveBadgeRequest);
router.put('/:id/reject', protect, authorize('Admin'), rejectBadgeRequest);

export default router;

