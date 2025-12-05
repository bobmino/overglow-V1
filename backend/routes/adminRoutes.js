import express from 'express';
import {
  getAdminStats,
  getOperators,
  updateOperatorStatus,
  getProducts,
  updateProductStatus,
  getUsers,
  deleteUser,
  initializeBadgesAndFlags,
  createBadge,
  getAllBadges,
  getRequestableBadges,
  assignBadgeToProducts,
  assignBadgeToOperators,
  updateBadge,
  deleteBadge,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, authorize('Admin'), getAdminStats);
router.get('/operators', protect, authorize('Admin'), getOperators);
router.put('/operators/:id/status', protect, authorize('Admin'), updateOperatorStatus);
router.get('/products', protect, authorize('Admin'), getProducts);
router.put('/products/:id/status', protect, authorize('Admin'), updateProductStatus);
router.get('/users', protect, authorize('Admin'), getUsers);
router.delete('/users/:id', protect, authorize('Admin'), deleteUser);
router.post('/initialize-badges', protect, authorize('Admin'), initializeBadgesAndFlags);

// Badge management routes
router.post('/badges', protect, authorize('Admin'), createBadge);
router.get('/badges', protect, authorize('Admin'), getAllBadges);
router.get('/badges/requestable', protect, authorize('Admin'), getRequestableBadges);
router.post('/badges/assign-products', protect, authorize('Admin'), assignBadgeToProducts);
router.post('/badges/assign-operators', protect, authorize('Admin'), assignBadgeToOperators);
router.put('/badges/:id', protect, authorize('Admin'), updateBadge);
router.delete('/badges/:id', protect, authorize('Admin'), deleteBadge);

export default router;
