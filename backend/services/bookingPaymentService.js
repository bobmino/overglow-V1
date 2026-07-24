import Booking from '../models/bookingModel.js';
import User from '../models/userModel.js';
import Operator from '../models/operatorModel.js';
import { logger } from '../utils/logger.js';
import notificationHub from './notificationHub.js';
import { notifyPaymentReceived } from '../utils/notificationService.js';

/**
 * Confirm a booking after successful PSP payment or admin offline validation.
 * Idempotent: safe to call multiple times (webhook retries).
 * Stock/capacity: already held at booking creation via Pending/PENDING_PAYMENT —
 * this function MUST NOT reserve capacity again.
 *
 * @param {{ bookingId: string|import('mongoose').Types.ObjectId, paymentIntentId?: string, webhookEventId?: string, source?: string }}
 */
export const validateAndConfirmBookingPayment = async ({
  bookingId,
  paymentIntentId,
  webhookEventId,
  source = 'psp',
  notify = true,
}) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found for payment confirmation');
  }

  if (booking.status === 'Cancelled') {
    throw new Error('Cannot confirm a cancelled booking');
  }

  // Idempotence by webhook event id
  if (webhookEventId && booking.lastWebhookEventId === webhookEventId) {
    logger.info('Webhook event already processed (idempotent)', {
      bookingId: booking._id.toString(),
      webhookEventId,
    });
    return booking;
  }

  if (
    paymentIntentId &&
    booking.paymentIntentId &&
    booking.paymentIntentId !== paymentIntentId
  ) {
    throw new Error('Payment intent mismatch');
  }

  const alreadyConfirmed = booking.status === 'Confirmed' && booking.paymentStatus === 'paid';

  if (alreadyConfirmed) {
    if (webhookEventId) {
      booking.lastWebhookEventId = webhookEventId;
      await booking.save();
    }
    return booking;
  }

  if (paymentIntentId) {
    booking.paymentIntentId = paymentIntentId;
  }

  booking.status = 'Confirmed';
  booking.paymentStatus = 'paid';
  booking.paidAt = booking.paidAt || new Date();
  if (webhookEventId) {
    booking.lastWebhookEventId = webhookEventId;
  }
  if (!booking.payoutStatus || booking.payoutStatus === 'pending') {
    booking.payoutStatus = 'scheduled';
  }

  await booking.save();

  logger.info('Booking payment confirmed', {
    bookingId: booking._id.toString(),
    source,
    paymentIntentId: booking.paymentIntentId,
    webhookEventId,
  });

  // Premium email + operator alert (webhooks / admin paths that don't notify elsewhere)
  if (notify) {
    try {
      const populated = await Booking.findById(booking._id).populate({
        path: 'schedule',
        populate: { path: 'product' },
      });
      const user = await User.findById(booking.user);
      if (user?.email) {
        notificationHub.dispatch('BOOKING_SUCCESS', {
          to: user.email,
          booking: populated,
          user,
        });
      }

      const recipientIds = [];
      if (booking.operator) {
        const op = await Operator.findById(booking.operator).select('user');
        if (op?.user) recipientIds.push(op.user);
      }
      const admins = await User.find({ role: 'Admin' }).select('_id');
      admins.forEach((a) => recipientIds.push(a._id));
      await notifyPaymentReceived(populated || booking, recipientIds);
    } catch (notifyErr) {
      logger.warn('Post-confirm notification failed', { message: notifyErr.message });
    }
  }

  return booking;
};

export default validateAndConfirmBookingPayment;
