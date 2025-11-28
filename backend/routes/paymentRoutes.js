import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createStripeIntent,
  createPaypalOrder,
  initCmiPayment,
  getBankDetails
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-stripe-intent', protect, createStripeIntent);
router.post('/create-paypal-order', protect, createPaypalOrder);
router.post('/cmi-init', protect, initCmiPayment);
router.get('/bank-details', protect, getBankDetails);

export default router;
