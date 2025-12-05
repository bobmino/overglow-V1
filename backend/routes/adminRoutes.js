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

export default router;
