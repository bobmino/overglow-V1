import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
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

// Protected payment routes
router.post('/create-stripe-intent', protect, createStripeIntent);
router.post('/create-paypal-order', protect, createPaypalOrder);
router.post('/cmi-init', protect, initCmiPayment);
router.post('/cash-pickup', protect, createCashPickupPayment);
router.post('/cash-delivery', protect, createCashDeliveryPayment);
router.get('/bank-details', protect, getBankDetails);

export default router;
