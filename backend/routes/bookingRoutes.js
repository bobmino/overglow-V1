import express from 'express';
import { check } from 'express-validator';
import { createPaymentIntent, createBooking, getMyBookings, cancelBooking, updateBookingNote, markBookingHandled } from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-payment-intent', protect, createPaymentIntent);

router.post(
  '/',
  protect,
  [
    check('scheduleId', 'Schedule ID is required').not().isEmpty(),
    check('numberOfTickets', 'Number of tickets is required').isNumeric(),
  ],
  createBooking
);

router.get('/my-bookings', protect, getMyBookings);

router.put('/:id/cancel', protect, cancelBooking);

router.put('/:id/note', protect, authorize('Opérateur'), updateBookingNote);

router.put('/:id/handle', protect, authorize('Opérateur'), markBookingHandled);

export default router;
