import express from 'express';
import {
  getLoyaltyStatus,
  redeemLoyaltyPoints,
  getLoyaltyHistory,
} from '../controllers/loyaltyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/status', protect, getLoyaltyStatus);
router.get('/history', protect, getLoyaltyHistory);
router.post('/redeem', protect, redeemLoyaltyPoints);

export default router;

