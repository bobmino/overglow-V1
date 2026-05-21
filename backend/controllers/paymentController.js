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

// @desc    Get Bank Transfer Details with dynamic RIB and payment reference
// @route   GET /api/payments/bank-details?bookingId=xxx
// @access  Private
const getBankDetails = async (req, res) => {
  const { bookingId } = req.query;

  // Generate a unique payment reference
  const paymentReference = bookingId
    ? `OG-${bookingId.toString().slice(-8).toUpperCase()}`
    : `OG-${Date.now().toString(36).toUpperCase()}`;

  // Dynamic RIB based on operator or platform (can be extended per operator)
  const bankDetails = {
    bankName: 'Attijariwafa Bank',
    accountName: 'Overglow Trip SARL',
    iban: 'MA64 0077 8800 0000 1111 2222 33',
    swift: 'OVGLMAMC',
    paymentReference: paymentReference,
    message: `Veuillez inclure la référence "${paymentReference}" dans le motif du virement.`,
  };

  // If bookingId provided, update booking with payment reference
  if (bookingId) {
    try {
      const booking = await Booking.findById(bookingId);
      if (booking) {
        booking.paymentReference = paymentReference;
        booking.paymentMethod = 'bank_transfer';
        booking.status = 'PENDING_PAYMENT';
        await booking.save();
      }
    } catch (err) {
      console.error('Failed to update booking with payment reference:', err.message);
    }
  }

  res.json(bankDetails);
};

// @desc    Initiate Bank Transfer payment
// @route   POST /api/payments/bank-transfer
// @access  Private
const createBankTransferPayment = async (req, res) => {
  const { bookingId, amount } = req.body;

  if (!bookingId) {
    return res.status(400).json({ message: 'Booking ID is required' });
  }

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Generate unique payment reference
    const paymentReference = `OG-${bookingId.toString().slice(-8).toUpperCase()}`;

    // Update booking status
    booking.paymentMethod = 'bank_transfer';
    booking.paymentStatus = 'pending';
    booking.status = 'PENDING_PAYMENT';
    booking.paymentReference = paymentReference;
    await booking.save();

    // Bank details (can be made dynamic per operator in the future)
    const bankDetails = {
      bankName: 'Attijariwafa Bank',
      accountName: 'Overglow Trip SARL',
      iban: 'MA64 0077 8800 0000 1111 2222 33',
      swift: 'OVGLMAMC',
      paymentReference: paymentReference,
      amount: amount || booking.totalAmount,
      currency: 'MAD',
    };

    res.json({
      type: 'bank_transfer',
      bookingId: bookingId,
      status: 'pending',
      paymentReference: paymentReference,
      bankDetails: bankDetails,
      message: 'Virement bancaire initié. Veuillez effectuer le virement avec la référence fournie.',
      instructions: `Effectuez un virement de ${bankDetails.amount} MAD vers le compte indiqué en utilisant la référence "${paymentReference}". Votre réservation sera confirmée dès réception du virement.`,
    });
  } catch (err) {
    console.error('Bank transfer payment error:', err);
    res.status(500).json({ message: 'Failed to initiate bank transfer payment' });
  }
};

// @desc    Confirm Cash Pickup payment (mark booking as PENDING_PAYMENT)
// @route   POST /api/payments/cash-pickup
// @access  Private
const createCashPickupPayment = async (req, res) => {
  const { bookingId, amount } = req.body;

  try {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update booking for cash pickup
    booking.paymentMethod = 'cash_pickup';
    booking.paymentStatus = 'pending';
    booking.status = 'PENDING_PAYMENT';
    await booking.save();

    res.json({
      type: 'cash_pickup',
      bookingId: bookingId,
      amount: amount || booking.totalAmount,
      status: 'pending',
      message: 'Réservation confirmée. Le paiement en espèces sera collecté sur place.',
      instructions: 'Veuillez apporter le montant exact en espèces. Le paiement sera collecté au point de rendez-vous.',
    });
  } catch (err) {
    console.error('Cash pickup payment error:', err);
    res.status(500).json({ message: 'Failed to process cash pickup payment' });
  }
};

export {
  createStripeIntent,
  createPaypalOrder,
  initCmiPayment,
  getBankDetails,
  createBankTransferPayment,
  createCashPickupPayment,
  createCashDeliveryPayment,
  convertToMAD
};
