import mongoose from 'mongoose';
import Booking from '../models/bookingModel.js';
import Schedule from '../models/scheduleModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import Operator from '../models/operatorModel.js';
import { validationResult } from 'express-validator';
import { sendBookingConfirmation, sendCancellationEmail, sendOperatorBookingNotification } from '../utils/emailService.js';
import { notifyNewBooking } from '../utils/notificationService.js';
import { updateProductMetrics, updateOperatorMetrics } from '../utils/badgeService.js';
import { updateUserStatsAfterBooking } from '../utils/loyaltyService.js';
import { checkAvailability, reserveCapacity } from '../utils/availabilityService.js';
import { logger } from '../utils/logger.js';
import { captureException } from '../utils/sentry.js';
import { processPayment } from '../services/paymentService.js';

// @desc    Create payment intent (Placeholder)
// @route   POST /api/bookings/create-payment-intent
// @access  Private
const createPaymentIntent = async (req, res) => {
  const { amount, currency } = req.body;
  
  // Placeholder for Stripe or other payment gateway logic
  // const paymentIntent = await stripe.paymentIntents.create({ amount, currency });
  
  res.json({ clientSecret: 'fake_client_secret_' + Date.now() });
};

const createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      scheduleId,
      numberOfTickets,
      paymentIntentId,
      paymentId,
      paymentMethod,
      skipTheLineEnabled,
      skipTheLinePrice,
      deliveryAddress,
      virtualScheduleData,
    } = req.body;

    let targetScheduleId = scheduleId;
    const isVirtual = String(scheduleId).startsWith('virtual_');

    // Dynamically resolve virtual schedules inside the transaction/try block
    if (isVirtual) {
      if (!virtualScheduleData) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Données de créneau manquantes pour la réservation ouverte' });
      }

      let existingSchedule = await Schedule.findOne({
        product: virtualScheduleData.productId,
        date: virtualScheduleData.date,
        time: virtualScheduleData.time,
      }).session(session);

      if (!existingSchedule) {
        existingSchedule = await Schedule.create([{
          product: virtualScheduleData.productId,
          date: virtualScheduleData.date,
          time: virtualScheduleData.time,
          endTime: virtualScheduleData.endTime,
          capacity: virtualScheduleData.capacity || 100,
          price: virtualScheduleData.price || 0,
          currency: virtualScheduleData.currency || 'EUR',
        }], { session });
        existingSchedule = existingSchedule[0];
      }
      targetScheduleId = existingSchedule._id;
    }

    const actualPaymentIntentId = paymentIntentId || paymentId;

    // Validate inputs
    const tickets = Number(numberOfTickets);
    if (!tickets || tickets < 1) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Nombre de tickets invalide' });
    }

    // Only strictly check availability and reserve capacity for real schedules
    // Virtual schedules are generated on-demand (open availability), so they always have capacity
    if (!isVirtual) {
      const availabilityCheck = await checkAvailability(targetScheduleId, tickets);
      if (!availabilityCheck.available) {
        await session.abortTransaction();
        return res.status(400).json({ 
          message: availabilityCheck.reason || 'Créneau non disponible',
          availability: availabilityCheck.availability,
        });
      }

      const reservation = await reserveCapacity(targetScheduleId, tickets);
      if (!reservation.success) {
        await session.abortTransaction();
        return res.status(400).json({ 
          message: reservation.reason || 'Erreur lors de la réservation',
          availability: reservation.availability,
        });
      }
    }

    // Get schedule with product within transaction
    const schedule = await Schedule.findById(targetScheduleId)
      .populate('product')
      .session(session);
    
    if (!schedule) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Calculate pricing
    const ticketPrice = Number(schedule.price) || 0;
    const baseTotal = ticketPrice * tickets;
    
    // Add skip-the-line price if enabled
    const skipTheLineAmount = (skipTheLineEnabled && skipTheLinePrice) ? Number(skipTheLinePrice) * tickets : 0;
    const totalAmount = baseTotal + skipTheLineAmount;

    const serviceDate = schedule.date ? new Date(schedule.date) : new Date();
    const payoutDate = new Date(serviceDate);
    payoutDate.setDate(payoutDate.getDate() + 7);
    const payoutEligibleDate = new Date(serviceDate);
    payoutEligibleDate.setDate(payoutEligibleDate.getDate() + 7);

    // Create booking within transaction
    const booking = new Booking({
      user: req.user._id,
      schedule: targetScheduleId,
      operator: schedule.product.operator,
      numberOfTickets: tickets,
      totalAmount,
      totalPrice: totalAmount,
      status: 'Pending',
      paymentIntentId: actualPaymentIntentId,
      paymentStatus: 'pending',
      paymentMethod: paymentMethod || 'stripe',
      deliveryAddress: deliveryAddress || '',
      payoutStatus: 'pending',
      payoutDate,
      payoutEligibleDate,
    });

    const createdBooking = await booking.save({ session });

    // Add booking to schedule within transaction
    schedule.bookings.push(createdBooking._id);
    await schedule.save({ session });

    // Commit transaction
    await session.commitTransaction();

    // Provider-agnostic payment orchestration with simulation fallback.
    let paymentResult;
    try {
      paymentResult = await processPayment({
        provider: paymentMethod || 'stripe',
        amount: totalAmount,
        currency: 'EUR',
        paymentIntentId: actualPaymentIntentId,
        metadata: {
          bookingId: createdBooking._id.toString(),
          scheduleId: targetScheduleId.toString(),
          userId: req.user._id.toString(),
        },
      });

      createdBooking.paymentIntentId = paymentResult.transactionId || createdBooking.paymentIntentId;
      
      // For offline payment methods, payment status remains pending until collected
      const isOfflinePayment = ['cash_pickup', 'cash_delivery', 'bank_transfer'].includes(paymentMethod);
      createdBooking.paymentStatus = isOfflinePayment 
        ? 'pending' 
        : (paymentResult.status === 'succeeded' ? 'paid' : 'pending');
      
      createdBooking.payoutStatus = 'scheduled';
      createdBooking.payoutDate = payoutDate;
      createdBooking.payoutEligibleDate = payoutDate;
      await createdBooking.save();
    } catch (paymentError) {
      createdBooking.paymentStatus = 'failed';
      await createdBooking.save();

      logger.error('Silent payment failure during booking creation', {
        bookingId: createdBooking._id?.toString(),
        provider: paymentMethod || 'stripe',
        message: paymentError?.message,
      });
      captureException(paymentError, {
        bookingId: createdBooking._id?.toString(),
        provider: paymentMethod || 'stripe',
      });

      return res.status(202).json({
        success: true,
        message: 'Validation de la réservation en cours...',
        bookingId: createdBooking._id,
      });
    }

    // Populate booking for response (outside transaction for better performance)
    const populatedBooking = await Booking.findById(createdBooking._id).populate({
      path: 'schedule',
      populate: { path: 'product' },
    });

    // Do not send final confirmation before payment validation webhook.
    logger.info('Booking created in pending state', {
      bookingId: createdBooking._id?.toString(),
      paymentIntentId: createdBooking.paymentIntentId,
      status: createdBooking.status,
      paymentStatus: createdBooking.paymentStatus,
      payoutStatus: createdBooking.payoutStatus,
    });

    const bookingObject = populatedBooking.toObject();
    bookingObject.totalPrice = typeof bookingObject.totalPrice === 'number'
      ? bookingObject.totalPrice
      : bookingObject.totalAmount;
    bookingObject.totalAmount = typeof bookingObject.totalAmount === 'number'
      ? bookingObject.totalAmount
      : bookingObject.totalPrice;
    
    // Notify operator of new booking (async, don't wait)
    if (createdBooking.operator) {
      // In-app notification
      notifyNewBooking(createdBooking, createdBooking.operator).catch(err =>
        logger.error('Error notifying operator', { message: err?.message })
      );
      
      // Email notification to operator
      const Operator = (await import('../models/operatorModel.js')).default;
      const operator = await Operator.findById(createdBooking.operator);
      if (operator) {
        sendOperatorBookingNotification(populatedBooking, operator, req.user).catch(err =>
          logger.error('Error sending operator email notification', { message: err?.message })
        );
      }
      
      // Update metrics (async, don't wait)
      updateProductMetrics(schedule.product._id).catch(err =>
        logger.error('Error updating product metrics', { message: err?.message })
      );
      updateOperatorMetrics(createdBooking.operator).catch(err =>
        logger.error('Error updating operator metrics', { message: err?.message })
      );
    }

    // Update user loyalty stats (async, don't wait)
    updateUserStatsAfterBooking(req.user._id, totalAmount).catch(err =>
      logger.error('Error updating user loyalty stats', { message: err?.message })
    );

    res.status(201).json(bookingObject);
  } catch (error) {
    await session.abortTransaction();
    logger.error('Create booking error', { message: error?.message, stack: error?.stack });
    next(error);
  } finally {
    session.endSession();
  }
};

// Designed for Stripe webhook usage (or future PSP webhooks)
const validateAndConfirmBookingPayment = async ({ bookingId, paymentIntentId }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found for payment confirmation');
  }

  if (paymentIntentId && booking.paymentIntentId && booking.paymentIntentId !== paymentIntentId) {
    throw new Error('Payment intent mismatch');
  }

  if (booking.status === 'Confirmed') {
    return booking;
  }

  booking.status = 'Confirmed';
  booking.paymentStatus = 'paid';
  if (!booking.payoutStatus || booking.payoutStatus === 'pending') {
    booking.payoutStatus = 'scheduled';
  }
  await booking.save();
  return booking;
};

// @desc    Get my bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: 'schedule',
        populate: {
          path: 'product',
          select: 'title images city',
        },
      });
    // Ensure we always return an array
    res.json(Array.isArray(bookings) ? bookings : []);
  } catch (error) {
    logger.error('Get my bookings error', { message: error?.message, stack: error?.stack });
    next(error);
  }
};

// Note: cancelBooking has been moved to cancellationController.js
// This function is kept for backward compatibility but should use the new cancellation service

// @desc    Update booking internal note
// @route   PUT /api/bookings/:id/note
// @access  Private/Operator
const updateBookingNote = async (req, res, next) => {
  try {
    const operator = await Operator.findOne({ user: req.user._id });
    
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is the operator who owns this booking
    if (booking.operator.toString() !== operator._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    booking.internalNote = req.body.note || '';
    const updatedBooking = await booking.save();

    res.json(updatedBooking);
  } catch (error) {
    logger.error('Update booking note error', { message: error?.message, stack: error?.stack });
    next(error);
  }
};

// @desc    Mark booking as handled
// @route   PUT /api/bookings/:id/handle
// @access  Private/Operator
const markBookingHandled = async (req, res, next) => {
  try {
    const operator = await Operator.findOne({ user: req.user._id });
    
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is the operator who owns this booking
    if (booking.operator.toString() !== operator._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    booking.isHandled = true;
    booking.handledAt = new Date();
    const updatedBooking = await booking.save();

    res.json(updatedBooking);
  } catch (error) {
    logger.error('Mark booking handled error', { message: error?.message, stack: error?.stack });
    next(error);
  }
};

export {
  createPaymentIntent,
  createBooking,
  getMyBookings,
  updateBookingNote,
  markBookingHandled,
  validateAndConfirmBookingPayment,
};
