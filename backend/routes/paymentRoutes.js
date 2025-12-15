import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { strictLimiter } from '../middleware/rateLimiter.js';
import {
  createStripeIntent,
  createPaypalOrder,
  initCmiPayment,
  getBankDetails,
  createCashPickupPayment,
  createCashDeliveryPayment,
  convertToMAD
} from '../controllers/paymentController.js';

const router = express.Router();

// Public route for currency conversion
router.get('/convert-to-mad', convertToMAD);

// Protected payment routes with strict rate limiting
router.post('/create-stripe-intent', strictLimiter, protect, createStripeIntent);
router.post('/create-paypal-order', strictLimiter, protect, createPaypalOrder);
router.post('/cmi-init', strictLimiter, protect, initCmiPayment);
router.post('/cash-pickup', strictLimiter, protect, createCashPickupPayment);
router.post('/cash-delivery', strictLimiter, protect, createCashDeliveryPayment);
router.get('/bank-details', protect, getBankDetails);

export default router;
