import express from 'express';
import { check } from 'express-validator';
import { createPaymentIntent, createBooking, getMyBookings, updateBookingNote, markBookingHandled, bulkManualCheckout } from '../controllers/bookingController.js';
import { getRefundCalculation, cancelBookingRequest, processRefundRequest } from '../controllers/cancellationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-payment-intent', protect, createPaymentIntent);

// router.post('/bulk-manual-checkout', protect, bulkManualCheckout);

router.post(
  '/',
  protect,
  createBooking
);

router.get('/my-bookings', protect, getMyBookings);
router.get('/:id/refund-calculation', protect, getRefundCalculation);
router.post('/:id/cancel', protect, cancelBookingRequest);
router.post('/:id/process-refund', protect, authorize('Admin'), processRefundRequest);

router.put('/:id/note', protect, authorize('Opérateur'), updateBookingNote);

router.put('/:id/handle', protect, authorize('Opérateur'), markBookingHandled);

export default router;
