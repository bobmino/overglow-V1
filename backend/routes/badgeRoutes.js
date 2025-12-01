import express from 'express';
import {
  getBadges,
  getOperatorBadges,
  getProductBadges,
  updateOperatorBadges,
  updateProductBadges,
  initializeBadges,
} from '../controllers/badgeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getBadges);
router.get('/operator/:operatorId', getOperatorBadges);
router.get('/product/:productId', getProductBadges);
router.post('/update-operator/:operatorId', protect, updateOperatorBadges);
router.post('/update-product/:productId', protect, updateProductBadges);
router.post('/initialize', protect, authorize('Admin'), initializeBadges);

export default router;
