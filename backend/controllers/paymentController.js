import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';
import Booking from '../models/bookingModel.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// PayPal Configuration
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const paypalClient = new paypal.core.PayPalHttpClient(environment);

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
    const paymentIntent = await stripe.paymentIntents.create({
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
    const order = await paypalClient.execute(request);
    res.json({ id: order.result.id });
  } catch (error) {
    console.error('PayPal error:', error);
    res.status(500).json({ message: 'PayPal order creation failed' });
  }
};

// @desc    Handle CMI Payment (Mock)
// @route   POST /api/payments/cmi-init
// @access  Private
const initCmiPayment = async (req, res) => {
  // In a real implementation, this would generate a hash and redirect URL
  // for the CMI gateway.
  const { amount, bookingId } = req.body;
  
  // Mock response
  res.json({
    redirectUrl: `/payment/cmi-mock?amount=${amount}&bookingId=${bookingId}`,
    message: 'Redirecting to CMI gateway...'
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
  getBankDetails
};
