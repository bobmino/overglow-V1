import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';
import Booking from '../models/bookingModel.js';

// Lazy initialization to prevent crashes if keys are not set
let stripe = null;
let paypalClient = null;

const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
    try {
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    } catch (error) {
      console.error('Failed to initialize Stripe:', error.message);
    }
  }
  return stripe;
};

const getPaypalClient = () => {
  if (!paypalClient && process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
    try {
      const environment = new paypal.core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
      );
      paypalClient = new paypal.core.PayPalHttpClient(environment);
    } catch (error) {
      console.error('Failed to initialize PayPal:', error.message);
    }
  }
  return paypalClient;
};

// @desc    Create Stripe Payment Intent
// @route   POST /api/payments/create-stripe-intent
// @access  Private
const createStripeIntent = async (req, res) => {
  const { amount, currency } = req.body;

  // Check for mock mode or missing keys
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
    console.log('Using Mock Stripe Payment');
    return res.json({
      clientSecret: 'mock_secret_for_testing',
    });
  }

  try {
    const stripeInstance = getStripe();
    if (!stripeInstance) {
      // Return mock if Stripe is not configured
      return res.json({
        clientSecret: 'mock_secret_for_testing',
      });
    }

    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: currency || 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ message: 'Payment initiation failed' });
  }
};

// @desc    Create PayPal Order
// @route   POST /api/payments/create-paypal-order
// @access  Private
const createPaypalOrder = async (req, res) => {
  const { amount } = req.body;

  const client = getPaypalClient();
  if (!client) {
    return res.status(503).json({ message: 'PayPal is not configured' });
  }

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'EUR',
        value: amount.toString()
      }
    }]
  });

  try {
    const order = await client.execute(request);
    res.json({ id: order.result.id });
  } catch (error) {
    console.error('PayPal error:', error);
    res.status(500).json({ message: 'PayPal order creation failed' });
  }
};

// @desc    Handle CMI Payment
// @route   POST /api/payments/cmi-init
// @access  Private
const initCmiPayment = async (req, res) => {
  const { amount, bookingId, currency = 'MAD' } = req.body;
  
  // CMI Configuration (should be in env variables)
  const CMI_STORE_KEY = process.env.CMI_STORE_KEY || 'your_cmi_store_key';
  const CMI_URL = process.env.CMI_URL || 'https://payment.cmi.co.ma/payment/init';
  
  // Convert amount to cents (CMI expects amount in smallest currency unit)
  const amountInCents = Math.round(amount * 100);
  
  // Generate hash for CMI
  const crypto = await import('crypto');
  const hashString = `${CMI_STORE_KEY}${amountInCents}${currency}${bookingId}`;
  const hash = crypto.createHash('sha256').update(hashString).digest('hex');
  
  // In production, this would redirect to CMI gateway
  // For now, return payment details for frontend to handle
  res.json({
    redirectUrl: `${CMI_URL}?amount=${amountInCents}&currency=${currency}&orderId=${bookingId}&hash=${hash}`,
    amount: amount,
    currency: currency,
    bookingId: bookingId,
    hash: hash,
    message: 'Redirecting to CMI secure payment gateway...'
  });
};

// @desc    Handle Cash on Pickup payment
// @route   POST /api/payments/cash-pickup
// @access  Private
const createCashPickupPayment = async (req, res) => {
  const { bookingId, amount } = req.body;
  
  // Mark booking as pending payment (cash on pickup)
  const Booking = (await import('../models/bookingModel.js')).default;
  const booking = await Booking.findById(bookingId);
  
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }
  
  // Booking status remains 'Pending' until cash is collected
  res.json({
    type: 'cash_pickup',
    bookingId: bookingId,
    amount: amount,
    status: 'pending',
    message: 'Booking confirmed. Please pay in cash when you arrive.',
    instructions: 'Please bring the exact amount in cash. Payment will be collected at the meeting point.'
  });
};

// @desc    Handle Cash on Delivery payment
// @route   POST /api/payments/cash-delivery
// @access  Private
const createCashDeliveryPayment = async (req, res) => {
  const { bookingId, amount, deliveryAddress } = req.body;
  
  const Booking = (await import('../models/bookingModel.js')).default;
  const booking = await Booking.findById(bookingId);
  
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }
  
  // Store delivery address in booking
  booking.deliveryAddress = deliveryAddress;
  booking.paymentMethod = 'cash_delivery';
  await booking.save();
  
  res.json({
    type: 'cash_delivery',
    bookingId: bookingId,
    amount: amount,
    status: 'pending',
    deliveryAddress: deliveryAddress,
    message: 'Booking confirmed. Payment will be collected upon delivery.',
    instructions: 'Our delivery agent will collect payment when delivering your booking confirmation.'
  });
};

// @desc    Convert currency to MAD
// @route   GET /api/payments/convert-to-mad?amount=100&from=EUR
// @access  Public
const convertToMAD = async (req, res) => {
  const { amount, from = 'EUR' } = req.query;
  
  // Exchange rates (in production, fetch from API)
  const exchangeRates = {
    EUR: 10.8, // 1 EUR = 10.8 MAD (approximate)
    USD: 10.0, // 1 USD = 10.0 MAD (approximate)
    GBP: 13.5, // 1 GBP = 13.5 MAD (approximate)
    MAD: 1.0,
  };
  
  const rate = exchangeRates[from.toUpperCase()] || 1.0;
  const madAmount = parseFloat(amount) * rate;
  
  res.json({
    originalAmount: parseFloat(amount),
    originalCurrency: from.toUpperCase(),
    madAmount: Math.round(madAmount * 100) / 100, // Round to 2 decimals
    currency: 'MAD',
    exchangeRate: rate,
    lastUpdated: new Date().toISOString()
  });
};

// @desc    Get Bank Transfer Details
// @route   GET /api/payments/bank-details
// @access  Private
const getBankDetails = (req, res) => {
  res.json({
    bankName: 'Overglow Bank',
    accountName: 'Overglow Trip SARL',
    iban: 'MA64 0000 1111 2222 3333 4444 55',
    swift: 'OVGLMAMA',
    message: 'Please include your booking reference in the transfer description.'
  });
};

export {
  createStripeIntent,
  createPaypalOrder,
  initCmiPayment,
  getBankDetails,
  createCashPickupPayment,
  createCashDeliveryPayment,
  convertToMAD
};
