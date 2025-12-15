import Booking from '../models/bookingModel.js';
import Product from '../models/productModel.js';
import Schedule from '../models/scheduleModel.js';
import Withdrawal from '../models/withdrawalModel.js';
import { notifyRefundProcessed } from './notificationService.js';
import { sendCancellationEmail } from './emailService.js';

/**
 * Calculate refund amount based on cancellation policy and timing
 * @param {Object} booking - Booking object
 * @param {Object} product - Product object with cancellationPolicy
 * @param {Date} cancellationDate - Date when cancellation is requested
 * @returns {Object} { refundAmount, refundPercentage, isFreeCancellation }
 */
export const calculateRefund = async (bookingId, cancellationDate = new Date()) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate({
        path: 'schedule',
        populate: { path: 'product' }
      });
    
    if (!booking || !booking.schedule || !booking.schedule.product) {
      throw new Error('Booking or product not found');
    }

    const product = booking.schedule.product;
    const policy = product.cancellationPolicy || {
      type: 'moderate',
      freeCancellationHours: 24,
      refundPercentage: 100,
    };

    const scheduleDate = new Date(booking.schedule.date);
    const hoursUntilStart = (scheduleDate - cancellationDate) / (1000 * 60 * 60);

    let refundAmount = 0;
    let refundPercentage = 0;
    let isFreeCancellation = false;

    switch (policy.type) {
      case 'free':
        // Free cancellation if within the free cancellation window
        if (hoursUntilStart >= (policy.freeCancellationHours || 24)) {
          isFreeCancellation = true;
          refundPercentage = policy.refundPercentage || 100;
          refundAmount = (booking.totalAmount || booking.totalPrice || 0) * (refundPercentage / 100);
        } else {
          // Too late for free cancellation
          refundPercentage = 0;
          refundAmount = 0;
        }
        break;

      case 'moderate':
        // Moderate: full refund if cancelled 48h+ before, 50% if 24-48h, 0% if <24h
        if (hoursUntilStart >= 48) {
          refundPercentage = 100;
          refundAmount = booking.totalAmount || booking.totalPrice || 0;
        } else if (hoursUntilStart >= 24) {
          refundPercentage = 50;
          refundAmount = (booking.totalAmount || booking.totalPrice || 0) * 0.5;
        } else {
          refundPercentage = 0;
          refundAmount = 0;
        }
        break;

      case 'strict':
        // Strict: full refund if cancelled 7 days+ before, 50% if 3-7 days, 0% if <3 days
        const daysUntilStart = hoursUntilStart / 24;
        if (daysUntilStart >= 7) {
          refundPercentage = 100;
          refundAmount = booking.totalAmount || booking.totalPrice || 0;
        } else if (daysUntilStart >= 3) {
          refundPercentage = 50;
          refundAmount = (booking.totalAmount || booking.totalPrice || 0) * 0.5;
        } else {
          refundPercentage = 0;
          refundAmount = 0;
        }
        break;

      case 'non_refundable':
        // Non-refundable: no refund
        refundPercentage = 0;
        refundAmount = 0;
        break;

      default:
        // Default moderate policy
        if (hoursUntilStart >= 48) {
          refundPercentage = 100;
          refundAmount = booking.totalAmount || booking.totalPrice || 0;
        } else if (hoursUntilStart >= 24) {
          refundPercentage = 50;
          refundAmount = (booking.totalAmount || booking.totalPrice || 0) * 0.5;
        } else {
          refundPercentage = 0;
          refundAmount = 0;
        }
    }

    return {
      refundAmount: Math.round(refundAmount * 100) / 100, // Round to 2 decimals
      refundPercentage,
      isFreeCancellation,
      hoursUntilStart: Math.round(hoursUntilStart * 10) / 10,
      policyType: policy.type,
    };
  } catch (error) {
    console.error('Calculate refund error:', error);
    throw error;
  }
};

/**
 * Cancel a booking and process refund if applicable
 * @param {String} bookingId - Booking ID
 * @param {String} reason - Cancellation reason
 * @param {String} cancelledBy - 'user' or 'operator'
 * @returns {Object} Cancellation result
 */
export const cancelBooking = async (bookingId, reason = '', cancelledBy = 'user') => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate({
        path: 'schedule',
        populate: { path: 'product' }
      })
      .populate('user')
      .populate('operator');

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'Cancelled') {
      throw new Error('Booking is already cancelled');
    }

    // Calculate refund
    const refundInfo = await calculateRefund(bookingId);

    // Update booking
    booking.status = 'Cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    booking.refundAmount = refundInfo.refundAmount;
    booking.refundStatus = refundInfo.refundAmount > 0 ? 'Pending' : 'Not Applicable';

    await booking.save();

    // Create withdrawal/refund request if refund is applicable
    if (refundInfo.refundAmount > 0) {
      const withdrawal = new Withdrawal({
        user: booking.user._id,
        type: 'client_refund',
        amount: refundInfo.refundAmount,
        currency: 'EUR',
        status: 'Pending',
        reason: `Remboursement pour annulation de réservation: ${reason || 'Aucune raison fournie'}`,
        relatedBooking: booking._id,
        paymentMethod: 'bank_transfer', // Default, can be updated by admin
      });

      await withdrawal.save();

      // Notify admin about refund request
      const User = (await import('../models/userModel.js')).default;
      const admins = await User.find({ role: 'Admin' });
      const adminIds = admins.map(admin => admin._id);
      const { notifyWithdrawalRequest } = await import('./notificationService.js');
      await notifyWithdrawalRequest(withdrawal, adminIds);
    }

    // Update schedule capacity using availability service
    const { releaseCapacity } = await import('./availabilityService.js');
    await releaseCapacity(booking.schedule._id, booking._id);

    // Send cancellation email with refund info
    sendCancellationEmail(booking, booking.user, refundInfo).catch(err =>
      console.error('Error sending cancellation email:', err)
    );

    return {
      booking,
      refundInfo,
      message: refundInfo.refundAmount > 0
        ? `Réservation annulée. Remboursement de ${refundInfo.refundAmount}€ sera traité.`
        : 'Réservation annulée. Aucun remboursement applicable selon la politique d\'annulation.',
    };
  } catch (error) {
    console.error('Cancel booking error:', error);
    throw error;
  }
};

/**
 * Process refund for a cancelled booking
 * @param {String} bookingId - Booking ID
 * @param {String} paymentMethod - Payment method for refund
 * @param {Object} paymentDetails - Payment details
 * @returns {Object} Refund processing result
 */
export const processRefund = async (bookingId, paymentMethod, paymentDetails) => {
  try {
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'Cancelled') {
      throw new Error('Booking is not cancelled');
    }

    if (booking.refundStatus === 'Processed') {
      throw new Error('Refund already processed');
    }

    // Find or create withdrawal
    let withdrawal = await Withdrawal.findOne({
      relatedBooking: bookingId,
      type: 'client_refund',
    });

    if (!withdrawal) {
      withdrawal = new Withdrawal({
        user: booking.user,
        type: 'client_refund',
        amount: booking.refundAmount,
        currency: 'EUR',
        status: 'Processed',
        paymentMethod,
        paymentDetails,
        relatedBooking: bookingId,
      });
    } else {
      withdrawal.status = 'Processed';
      withdrawal.paymentMethod = paymentMethod;
      withdrawal.paymentDetails = paymentDetails;
      withdrawal.processedAt = new Date();
    }

    await withdrawal.save();

    // Update booking refund status
    booking.refundStatus = 'Processed';
    await booking.save();

    // Notify user (in-app notification)
    const User = (await import('../models/userModel.js')).default;
    const user = await User.findById(booking.user);
    if (user) {
      await notifyRefundProcessed(withdrawal, booking.user);
      
      // Send refund processed email
      sendRefundProcessedEmail(withdrawal, user).catch(err =>
        console.error('Error sending refund processed email:', err)
      );
    }

    return {
      withdrawal,
      booking,
      message: 'Remboursement traité avec succès',
    };
  } catch (error) {
    console.error('Process refund error:', error);
    throw error;
  }
};
