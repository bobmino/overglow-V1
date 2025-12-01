import Booking from '../models/bookingModel.js';
import Schedule from '../models/scheduleModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import Operator from '../models/operatorModel.js';
import { validationResult } from 'express-validator';
import { sendBookingConfirmation, sendCancellationEmail } from '../utils/emailService.js';
import { notifyNewBooking } from '../utils/notificationService.js';

// @desc    Create payment intent (Placeholder)
// @route   POST /api/bookings/create-payment-intent
// @access  Private
const createPaymentIntent = async (req, res) => {
  const { amount, currency } = req.body;
  
  // Placeholder for Stripe or other payment gateway logic
  // const paymentIntent = await stripe.paymentIntents.create({ amount, currency });
  
  res.json({ clientSecret: 'fake_client_secret_' + Date.now() });
};

// @desc    Create a booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { scheduleId, numberOfTickets, paymentIntentId } = req.body;

  const schedule = await Schedule.findById(scheduleId).populate('product');
  if (!schedule) {
    res.status(404);
    throw new Error('Schedule not found');
  }

  if (schedule.bookings.length + numberOfTickets > schedule.capacity) {
    res.status(400);
    throw new Error('Not enough capacity');
  }

  const ticketPrice = Number(schedule.price) || 0;
  const totalAmount = ticketPrice * Number(numberOfTickets);

  const booking = new Booking({
    user: req.user._id,
    schedule: scheduleId,
    operator: schedule.product.operator,
    numberOfTickets,
    totalAmount,
    totalPrice: totalAmount,
    status: 'Confirmed', // Assuming payment succeeded if we are here
    paymentIntentId,
  });

  const createdBooking = await booking.save();

  schedule.bookings.push(createdBooking._id);
  await schedule.save();

  // Populate booking for email
  const populatedBooking = await Booking.findById(createdBooking._id)
    .populate({
      path: 'schedule',
      populate: { path: 'product' }
    });

  // Send confirmation email
  sendBookingConfirmation(populatedBooking, req.user);

  const bookingObject = populatedBooking.toObject();
  bookingObject.totalPrice = typeof bookingObject.totalPrice === 'number'
    ? bookingObject.totalPrice
    : bookingObject.totalAmount;
  bookingObject.totalAmount = typeof bookingObject.totalAmount === 'number'
    ? bookingObject.totalAmount
    : bookingObject.totalPrice;
  
  // Notify operator of new booking
  if (createdBooking.operator) {
    await notifyNewBooking(createdBooking, createdBooking.operator);
  }

  res.status(201).json(bookingObject);
};

// @desc    Get my bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
const getMyBookings = async (req, res) => {
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
    console.error('Get my bookings error:', error);
    res.status(500).json([]); // Return empty array on error
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate({
      path: 'schedule',
      populate: { path: 'product' }
    });

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Check if user owns this booking
  if (booking.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to cancel this booking');
  }

  // Check if booking can be cancelled
  if (booking.status === 'Cancelled') {
    res.status(400);
    throw new Error('Booking is already cancelled');
  }

  booking.status = 'Cancelled';
  const updatedBooking = await booking.save();

  // Send cancellation email
  sendCancellationEmail(booking, req.user);

  res.json(updatedBooking);
};

// @desc    Update booking internal note
// @route   PUT /api/bookings/:id/note
// @access  Private/Operator
const updateBookingNote = async (req, res) => {
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
    console.error('Update booking note error:', error);
    res.status(500).json({ message: 'Failed to update booking note' });
  }
};

// @desc    Mark booking as handled
// @route   PUT /api/bookings/:id/handle
// @access  Private/Operator
const markBookingHandled = async (req, res) => {
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
    console.error('Mark booking handled error:', error);
    res.status(500).json({ message: 'Failed to mark booking as handled' });
  }
};

export { createPaymentIntent, createBooking, getMyBookings, cancelBooking, updateBookingNote, markBookingHandled };
