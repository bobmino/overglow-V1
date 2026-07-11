import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { strictLimiter } from '../middleware/rateLimiter.js';
import {
  createStripeIntent,
  createPaypalOrder,
  capturePaypalOrder,
  handleStripeWebhook,
  handlePaypalWebhook,
  initCmiPayment,
  getBankDetails,
  createBankTransferPayment,
  createCashPickupPayment,
  createCashDeliveryPayment,
  convertToMAD,
} from '../controllers/paymentController.js';

const router = express.Router();

// Public route for currency conversion
router.get('/convert-to-mad', convertToMAD);

// PSP webhooks (no auth — signature verified inside handlers)
router.post('/webhook/stripe', handleStripeWebhook);
router.post('/webhook/paypal', handlePaypalWebhook);

// Protected payment routes with strict rate limiting
router.post('/create-stripe-intent', strictLimiter, protect, createStripeIntent);
router.post('/create-paypal-order', strictLimiter, protect, createPaypalOrder);
router.post('/capture-paypal-order', strictLimiter, protect, capturePaypalOrder);
router.post('/cmi-init', strictLimiter, protect, initCmiPayment);
router.post('/cash-pickup', strictLimiter, protect, createCashPickupPayment);
router.post('/cash-delivery', strictLimiter, protect, createCashDeliveryPayment);
router.post('/bank-transfer', strictLimiter, protect, createBankTransferPayment);
router.get('/bank-details', protect, getBankDetails);

export default router;
