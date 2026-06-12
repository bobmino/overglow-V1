import mongoose from 'mongoose';
import Booking from '../models/bookingModel.js';
import Schedule from '../models/scheduleModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import Operator from '../models/operatorModel.js';
import { validationResult } from 'express-validator';
import { sendBookingConfirmation, sendCancellationEmail, sendOperatorBookingNotification, sendCircuitBookingConfirmation } from '../utils/emailService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { notifyNewBooking } from '../utils/notificationService.js';
import { updateProductMetrics, updateOperatorMetrics } from '../utils/badgeService.js';
import { updateUserStatsAfterBooking } from '../utils/loyaltyService.js';
import { checkAvailability, reserveCapacity } from '../utils/availabilityService.js';
import { logger } from '../utils/logger.js';
import { captureException } from '../utils/sentry.js';
import { processPayment } from '../services/paymentService.js';
import notificationHub from '../services/notificationHub.js';
import { clearCache } from '../middleware/cacheMiddleware.js';

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
  let session = null;
  let transactionActive = false;
  let attempts = 0;
  
  // CORRECTION: Log détaillé pour déboguer les erreurs 400
  logger.info('createBooking called', {
    body: req.body,
    userId: req.user?._id?.toString(),
    headers: { contentType: req.headers['content-type'] }
  });
  
  while (attempts < 2) {
    try {
      attempts++;
      

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
      
      // CORRECTION: Validation renforcée de scheduleId
      if (!scheduleId) {
        logger.error('createBooking 400 Error: scheduleId manquant', { body: req.body });
        return res.status(400).json({ message: 'Identifiant du créneau manquant. Veuillez sélectionner un horaire.' });
      }
      
      const tickets = Number(numberOfTickets) || 0;
      if (tickets < 1 || isNaN(tickets)) {
        if (transactionActive && session) {
          await session.abortTransaction();
        }
        if (session) session.endSession();
        logger.error('createBooking 400 Error: tickets invalide', { numberOfTickets, tickets });
        return res.status(400).json({ message: 'Nombre de tickets invalide' });
      }

      const skipLinePrice = Number(skipTheLinePrice) || 0;
      const skipLineEnabled = Boolean(skipTheLineEnabled);

      // Initialize session only on first attempt if we want transactions
      if (attempts === 1) {
        try {
          session = await mongoose.startSession();
          session.startTransaction();
          transactionActive = true;
        } catch (err) {
          logger.warn('Could not start session/transaction, falling back to no-transaction mode', { message: err.message });
          transactionActive = false;
          if (session) {
            session.endSession();
            session = null;
          }
        }
      }

      let targetScheduleId = scheduleId;
      // CORRECTION: Vérification sécurisée de scheduleId avant String()
      const isVirtual = scheduleId && String(scheduleId).startsWith('virtual_');

      // Dynamically resolve virtual schedules
      if (isVirtual) {
        if (!virtualScheduleData) {
          if (transactionActive && session) await session.abortTransaction();
          if (session) session.endSession();
          return res.status(400).json({ message: 'Données de créneau manquantes pour la réservation ouverte' });
        }

        let existingScheduleQuery = Schedule.findOne({
          product: virtualScheduleData.productId,
          date: virtualScheduleData.date,
          time: virtualScheduleData.time,
        });

        if (transactionActive && session) {
          existingScheduleQuery = existingScheduleQuery.session(session);
        }
        let existingSchedule = await existingScheduleQuery;

        if (!existingSchedule) {
          const createData = {
            product: virtualScheduleData.productId,
            date: virtualScheduleData.date,
            time: virtualScheduleData.time,
            endTime: virtualScheduleData.endTime,
            capacity: virtualScheduleData.capacity || 100,
            price: virtualScheduleData.price || 0,
            currency: virtualScheduleData.currency || 'EUR',
          };

          if (transactionActive && session) {
            const createdArr = await Schedule.create([createData], { session });
            existingSchedule = createdArr[0];
          } else {
            existingSchedule = await Schedule.create(createData);
          }
        }
        targetScheduleId = existingSchedule._id;
      }

      // Check availability and reserve
      if (!isVirtual) {
        const availabilityCheck = await checkAvailability(targetScheduleId, tickets);
        if (!availabilityCheck.available) {
          if (transactionActive && session) await session.abortTransaction();
          if (session) session.endSession();
          return res.status(400).json({ 
            message: availabilityCheck.reason || 'Créneau non disponible',
            availability: availabilityCheck.availability,
          });
        }

        const reservation = await reserveCapacity(targetScheduleId, tickets);
        if (!reservation.success) {
          if (transactionActive && session) await session.abortTransaction();
          if (session) session.endSession();
          return res.status(400).json({ 
            message: reservation.reason || 'Erreur lors de la réservation',
            availability: reservation.availability,
          });
        }
      }

      // Get schedule with product
      let scheduleQuery = Schedule.findById(targetScheduleId).populate('product');
      if (transactionActive && session) {
        scheduleQuery = scheduleQuery.session(session);
      }
      const schedule = await scheduleQuery;
      
      if (!schedule) {
        if (transactionActive && session) await session.abortTransaction();
        if (session) session.endSession();
        return res.status(404).json({ message: 'Schedule not found' });
      }

      if (!schedule.product) {
        if (transactionActive && session) await session.abortTransaction();
        if (session) session.endSession();
        logger.error('createBooking 400 Error: Produit introuvable', { scheduleId: targetScheduleId });
        return res.status(400).json({ message: 'Produit associé au créneau introuvable' });
      }

      let operatorId = schedule.product.operator;
      if (!operatorId) {
        const Operator = (await import('../models/operatorModel.js')).default;
        const defaultOp = await Operator.findOne();
        if (defaultOp) {
          operatorId = defaultOp._id;
        } else {
          if (transactionActive && session) await session.abortTransaction();
          if (session) session.endSession();
          logger.error('createBooking 400 Error: Opérateur introuvable', { productId: schedule.product._id });
          return res.status(400).json({ message: 'Ce produit n\'a pas d\'opérateur assigné. La réservation est impossible.' });
        }
      }

      // Calculate pricing
      const ticketPrice = Number(schedule.price) || 0;
      const baseTotal = ticketPrice * tickets;
      const skipTheLineAmount = (skipLineEnabled && skipLinePrice) ? skipLinePrice * tickets : 0;
      const totalAmount = baseTotal + skipTheLineAmount;

      if (isNaN(totalAmount) || totalAmount < 0) {
        if (transactionActive && session) await session.abortTransaction();
        if (session) session.endSession();
        logger.error('createBooking 400 Error: Montant invalide', { totalAmount, ticketPrice, tickets, skipLineEnabled, skipLinePrice, baseTotal, skipTheLineAmount });
        return res.status(400).json({ message: 'Le montant total calculé est invalide' });
      }

      const serviceDate = schedule.date ? new Date(schedule.date) : new Date();
      const payoutDate = new Date(serviceDate);
      payoutDate.setDate(payoutDate.getDate() + 7);

      const bookingData = {
        user: req.user._id,
        schedule: targetScheduleId,
        operator: operatorId,
        numberOfTickets: tickets,
        totalAmount,
        totalPrice: totalAmount,
        status: 'Pending',
        paymentIntentId: paymentIntentId || paymentId,
        paymentStatus: 'pending',
        paymentMethod: paymentMethod || 'stripe',
        deliveryAddress: deliveryAddress || '',
        payoutStatus: 'pending',
        payoutDate,
        payoutEligibleDate: payoutDate,
      };

      let createdBooking;
      if (transactionActive && session) {
        const savedArr = await Booking.create([bookingData], { session });
        createdBooking = savedArr[0];
      } else {
        createdBooking = await Booking.create(bookingData);
      }

      // Add booking to schedule
      schedule.bookings.push(createdBooking._id);
      if (transactionActive && session) {
        await schedule.save({ session });
      } else {
        await schedule.save();
      }

      // Commit transaction
      if (transactionActive && session) {
        await session.commitTransaction();
        transactionActive = false;
      }
      
      if (session) {
        session.endSession();
        session = null;
      }

      // ----------------------------------------------------
      // Payment orchestration, notification and response
      // ----------------------------------------------------
      let paymentResult;
      const actualPaymentIntentId = paymentIntentId || paymentId;
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
        const isOfflinePayment = ['cash_pickup', 'cash_delivery', 'bank_transfer'].includes(paymentMethod);
        createdBooking.paymentStatus = isOfflinePayment 
          ? 'pending' 
          : (paymentResult.status === 'succeeded' ? 'paid' : 'pending');
        
        createdBooking.payoutStatus = 'scheduled';
        await createdBooking.save();
      } catch (paymentError) {
        createdBooking.paymentStatus = 'failed';
        await createdBooking.save();

        logger.error('Silent payment failure during booking creation', {
          bookingId: createdBooking._id?.toString(),
          provider: paymentMethod || 'stripe',
          message: paymentError?.message,
        });
        
        return res.status(202).json({
          success: true,
          message: 'Validation de la réservation en cours...',
          bookingId: createdBooking._id,
        });
      }

      const populatedBooking = await Booking.findById(createdBooking._id).populate({
        path: 'schedule',
        populate: { path: 'product' },
      });

      const bookingObject = populatedBooking.toObject();
      bookingObject.totalPrice = typeof bookingObject.totalPrice === 'number'
        ? bookingObject.totalPrice
        : bookingObject.totalAmount;
      bookingObject.totalAmount = typeof bookingObject.totalAmount === 'number'
        ? bookingObject.totalAmount
        : bookingObject.totalPrice;

      if (createdBooking.operator) {
        notifyNewBooking(createdBooking, createdBooking.operator).catch(err =>
          logger.error('Error notifying operator', { message: err?.message })
        );
        
        const Operator = (await import('../models/operatorModel.js')).default;
        const operator = await Operator.findById(createdBooking.operator);
        if (operator) {
          sendOperatorBookingNotification(populatedBooking, operator, req.user).catch(err =>
            logger.error('Error sending operator email notification', { message: err?.message })
          );
        }
        
        updateProductMetrics(schedule.product._id).catch(err =>
          logger.error('Error updating product metrics', { message: err?.message })
        );
        updateOperatorMetrics(createdBooking.operator).catch(err =>
          logger.error('Error updating operator metrics', { message: err?.message })
        );
      }

      updateUserStatsAfterBooking(req.user._id, totalAmount).catch(err =>
        logger.error('Error updating user loyalty stats', { message: err?.message })
      );

      // Send booking confirmation email to the client (Nodemailer legacy)
      sendBookingConfirmation(populatedBooking, req.user).catch(err => 
        logger.error('Error sending booking confirmation email to client', { message: err?.message })
      );

      // ── Resend premium email + Operator alert via NotificationHub ────────
      notificationHub.dispatch('BOOKING_SUCCESS', {
        to: req.user.email,
        booking: populatedBooking,
        user: req.user,
      });

      // ── Invalidation du cache Upstash Redis (disponibilités changent) ────
      clearCache('cache:*').catch((err) =>
        logger.error('Error clearing Redis cache after booking', { message: err?.message })
      );

      return res.status(201).json(bookingObject);
      
    } catch (error) {
      logger.error(`Create booking attempt ${attempts} failed`, { message: error?.message, code: error?.code });
      
      if (transactionActive && session) {
        try {
          await session.abortTransaction();
        } catch (abortErr) {
          logger.error('Abort transaction failed', { message: abortErr.message });
        }
      }
      
      if (session) {
        session.endSession();
        session = null;
      }
      
      transactionActive = false;
      
      // Check if error is due to MongoDB standalone not supporting transactions
      const isTxUnsupportedError = error.message?.includes('Transaction numbers are only allowed') ||
                                   error.message?.includes('does not support transactions') ||
                                   error.code === 251 ||
                                   error.codeName === 'IllegalOperation';
                                   
      if (isTxUnsupportedError && attempts === 1) {
        logger.warn('Transactions not supported by database. Retrying booking creation without transaction...', { code: error.code });
        continue; // Loop again, next attempt will run without session/transaction
      }
      
      next(error);
      break;
    }
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

// @desc    Bulk checkout for circuits
// @route   POST /api/bookings/bulk-manual-checkout
// @access  Private
const bulkManualCheckout = async (req, res, next) => {
  let session = null;
  let transactionActive = false;

  try {
    const { items, paymentMethod, paymentId, deliveryAddress } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Le circuit est vide ou invalide.' });
    }

    try {
      session = await mongoose.startSession();
      session.startTransaction();
      transactionActive = true;
    } catch (err) {
      logger.warn('Transactions non supportées. Mode dégradé activé.', { message: err.message });
      transactionActive = false;
    }

    // Générer la référence de paiement unique
    const paymentReference = 'OG-CIRCUIT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

    const createdBookings = [];
    const operatorsToNotify = new Set();
    let totalCircuitAmount = 0;

    for (const item of items) {
      const {
        scheduleId,
        numberOfTickets,
        skipTheLineEnabled,
        virtualScheduleData
      } = item;

      let targetScheduleId = scheduleId;
      const isVirtual = String(scheduleId).startsWith('virtual_');

      // Résoudre les créneaux virtuels
      if (isVirtual) {
        if (!virtualScheduleData) {
          throw new Error('Données de créneau manquantes pour la réservation ouverte');
        }

        let existingScheduleQuery = Schedule.findOne({
          product: virtualScheduleData.productId,
          date: virtualScheduleData.date,
          time: virtualScheduleData.time,
        });

        if (transactionActive && session) {
          existingScheduleQuery = existingScheduleQuery.session(session);
        }
        let existingSchedule = await existingScheduleQuery;

        if (!existingSchedule) {
          const createData = {
            product: virtualScheduleData.productId,
            date: virtualScheduleData.date,
            time: virtualScheduleData.time,
            endTime: virtualScheduleData.endTime,
            capacity: virtualScheduleData.capacity || 100,
            price: virtualScheduleData.price || 0,
            currency: virtualScheduleData.currency || 'EUR',
          };

          if (transactionActive && session) {
            const createdArr = await Schedule.create([createData], { session });
            existingSchedule = createdArr[0];
          } else {
            existingSchedule = await Schedule.create(createData);
          }
        }
        targetScheduleId = existingSchedule._id;
      }

      // Check disponibilité
      if (!isVirtual) {
        const availabilityCheck = await checkAvailability(targetScheduleId, numberOfTickets);
        if (!availabilityCheck.available) {
          throw new Error(`Le créneau pour une de vos activités n'est plus disponible: ${availabilityCheck.reason}`);
        }

        const reservation = await reserveCapacity(targetScheduleId, numberOfTickets);
        if (!reservation.success) {
          throw new Error(`Erreur lors de la réservation de capacité: ${reservation.reason}`);
        }
      }

      // Récupérer le produit et le schedule
      let scheduleQuery = Schedule.findById(targetScheduleId).populate('product');
      if (transactionActive && session) {
        scheduleQuery = scheduleQuery.session(session);
      }
      const scheduleDoc = await scheduleQuery;

      if (!scheduleDoc || !scheduleDoc.product) {
        throw new Error('Produit ou créneau introuvable.');
      }

      const productDoc = scheduleDoc.product;

      let operatorId = productDoc.operator;
      if (!operatorId) {
        const Operator = (await import('../models/operatorModel.js')).default;
        const defaultOp = await Operator.findOne();
        operatorId = defaultOp ? defaultOp._id : null;
      }

      if (operatorId) {
        operatorsToNotify.add(operatorId.toString());
      }

      const tickets = Number(numberOfTickets) || 1;
      const ticketPrice = Number(scheduleDoc.price || productDoc.price) || 0;
      const baseTotal = ticketPrice * tickets;
      
      const skipLinePrice = skipTheLineEnabled && productDoc.skipTheLine?.enabled 
        ? Number(productDoc.skipTheLine.additionalPrice) 
        : 0;
      const skipTheLineAmount = skipLinePrice * tickets;
      
      const totalAmount = baseTotal + skipTheLineAmount;
      totalCircuitAmount += totalAmount;

      const serviceDate = scheduleDoc.date ? new Date(scheduleDoc.date) : new Date();
      const payoutDate = new Date(serviceDate);
      payoutDate.setDate(payoutDate.getDate() + 7);

      const bookingData = {
        user: req.user._id,
        schedule: targetScheduleId,
        operator: operatorId,
        numberOfTickets: tickets,
        totalAmount,
        totalPrice: totalAmount,
        status: 'Pending', // pending until admin validate the payment
        paymentIntentId: paymentId || '',
        paymentStatus: 'pending',
        paymentMethod: paymentMethod || 'bank_transfer',
        paymentReference: paymentReference,
        deliveryAddress: deliveryAddress || '',
        payoutStatus: 'pending',
        payoutDate,
        payoutEligibleDate: payoutDate,
      };

      let createdBooking;
      if (transactionActive && session) {
        const savedArr = await Booking.create([bookingData], { session });
        createdBooking = savedArr[0];
      } else {
        createdBooking = await Booking.create(bookingData);
      }

      // Add booking to schedule
      scheduleDoc.bookings.push(createdBooking._id);
      if (transactionActive && session) {
        await scheduleDoc.save({ session });
      } else {
        await scheduleDoc.save();
      }

      const populatedBooking = await Booking.findById(createdBooking._id)
        .populate({
          path: 'schedule',
          populate: { path: 'product' },
        });

      createdBookings.push(populatedBooking);
    }

    if (transactionActive && session) {
      await session.commitTransaction();
      transactionActive = false;
    }

    if (session) {
      session.endSession();
      session = null;
    }

    // Post-booking notifications (asynchrones)
    try {
      if (typeof sendCircuitBookingConfirmation === 'function') {
        sendCircuitBookingConfirmation(createdBookings, req.user, paymentReference).catch(err => 
          logger.error('Error sending circuit booking confirmation', { message: err?.message })
        );
      }

      // ── Resend premium email + Operator alert via NotificationHub ────────
      notificationHub.dispatch('BOOKING_SUCCESS', {
        to: req.user.email,
        booking: createdBookings[0], // Or handle multi-booking email
        user: req.user,
      });

      // ── Invalidation du cache Upstash Redis ──────────────────────────────
      clearCache('cache:*').catch((err) =>
        logger.error('Error clearing Redis cache after circuit booking', { message: err?.message })
      );

      // Update loyalty stats
      updateUserStatsAfterBooking(req.user._id, totalCircuitAmount).catch(err =>
        logger.error('Error updating user loyalty stats', { message: err?.message })
      );

      // Mettre à jour les métriques pour chaque produit/opérateur unique
      const productIds = [...new Set(createdBookings.map(b => b.schedule.product._id.toString()))];
      productIds.forEach(pid => {
        updateProductMetrics(pid).catch(err => logger.error('Error updating product metrics', { message: err?.message }));
      });

      operatorsToNotify.forEach(oid => {
        updateOperatorMetrics(oid).catch(err => logger.error('Error updating operator metrics', { message: err?.message }));
        // Optionnel : Notifier les opérateurs
      });

    } catch (err) {
      logger.error('Post-booking operations failed', { message: err.message });
    }

    res.status(201).json({
      success: true,
      bookings: createdBookings,
      paymentReference
    });

  } catch (error) {
    if (transactionActive && session) {
      await session.abortTransaction();
    }
    if (session) session.endSession();

    logger.error('Bulk manual checkout error', { message: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Erreur lors de la création du circuit.' });
  }
};

// @desc    Update booking status (Admin)
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user')
      .populate({
        path: 'schedule',
        populate: {
          path: 'product',
          model: 'Product'
        }
      });
    if (!booking) {
      return res.status(404).json({ message: 'Réservation introuvable' });
    }

    const { status } = req.body;
    
    // Map CONFIRMED to Confirmed
    if (status === 'CONFIRMED' || status === 'Confirmed') {
      booking.status = 'Confirmed';
      booking.paymentStatus = 'paid';
      booking.isHandled = true;
      booking.handledAt = new Date();
    } else {
      booking.status = status;
    }

    await booking.save();

    // Optionally send email
    if (booking.status === 'Confirmed' && booking.user && booking.user.email) {
      try {
        let compiledHtml = null;
        try {
          const templatePath = path.join(__dirname, '..', 'templates', 'emails', 'confirmation.hbs');
          if (fs.existsSync(templatePath)) {
            const templateSource = fs.readFileSync(templatePath, 'utf8');
            const template = Handlebars.compile(templateSource);
            
            const rawDate = booking.schedule?.date;
            let formattedDate = 'À confirmer';
            if (rawDate) {
              const d = new Date(rawDate);
              if (!Number.isNaN(d.getTime())) {
                formattedDate = d.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
              }
            }

            compiledHtml = template({
              customerName: booking.user.name || 'Voyageur',
              bookingId: booking._id.toString().slice(-8).toUpperCase(),
              title: booking.schedule?.product?.title || 'Expérience Overglow',
              date: formattedDate,
              time: booking.schedule?.time || 'À confirmer',
              tickets: booking.numberOfTickets || 1,
              price: booking.totalAmount ? `€${Number(booking.totalAmount).toFixed(2)}` : '€0.00'
            });
          }
        } catch (templateErr) {
          console.error('Failed to compile email template, falling back to built-in template:', templateErr.message);
        }

        await sendBookingConfirmation(booking, booking.user, compiledHtml);
      } catch (err) {
        console.error('Failed to send confirmation email:', err.message);
      }
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  createPaymentIntent,
  createBooking,
  getMyBookings,
  updateBookingNote,
  markBookingHandled,
  validateAndConfirmBookingPayment,
  updateBookingStatus,
  // bulkManualCheckout,
};
