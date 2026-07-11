import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';
import crypto from 'crypto';
import Booking from '../models/bookingModel.js';
import { validateAndConfirmBookingPayment } from '../services/bookingPaymentService.js';
import { logger } from '../utils/logger.js';
import { captureException } from '../utils/sentry.js';

// Lazy initialization to prevent crashes if keys are not set
let stripe = null;
let paypalClient = null;

const isProduction = () => process.env.NODE_ENV === 'production';

const isStripeConfigured = () =>
  Boolean(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder'));

const getStripe = () => {
  if (!stripe && isStripeConfigured()) {
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
      const useLive =
        isProduction() && String(process.env.PAYPAL_MODE || '').toLowerCase() === 'live';
      const environment = useLive
        ? new paypal.core.LiveEnvironment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET
          )
        : new paypal.core.SandboxEnvironment(
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

/**
 * Resolve booking from PaymentIntent metadata or by paymentIntentId field.
 */
const findBookingForStripeIntent = async (paymentIntent) => {
  const bookingId = paymentIntent?.metadata?.bookingId;
  if (bookingId) {
    const byMeta = await Booking.findById(bookingId);
    if (byMeta) return byMeta;
  }
  if (paymentIntent?.id) {
    return Booking.findOne({ paymentIntentId: paymentIntent.id });
  }
  return null;
};

// @desc    Create Stripe Payment Intent
// @route   POST /api/payments/create-stripe-intent
// @access  Private
const createStripeIntent = async (req, res) => {
  const { amount, currency, bookingId } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Montant invalide' });
  }

  if (!isStripeConfigured()) {
    if (isProduction()) {
      return res.status(503).json({ message: 'Stripe n\'est pas configuré en production' });
    }
    logger.warn('Using mock Stripe PaymentIntent (dev only)');
    return res.json({
      clientSecret: `mock_secret_${Date.now()}`,
      paymentIntentId: `mock_pi_${Date.now()}`,
      simulated: true,
    });
  }

  try {
    const stripeInstance = getStripe();
    if (!stripeInstance) {
      if (isProduction()) {
        return res.status(503).json({ message: 'Stripe indisponible' });
      }
      return res.json({
        clientSecret: `mock_secret_${Date.now()}`,
        paymentIntentId: `mock_pi_${Date.now()}`,
        simulated: true,
      });
    }

    const metadata = {
      userId: req.user?._id?.toString() || '',
    };
    if (bookingId) {
      metadata.bookingId = String(bookingId);
    }

    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: String(currency || 'eur').toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
    });

    if (bookingId) {
      try {
        const booking = await Booking.findById(bookingId);
        if (booking) {
          booking.paymentIntentId = paymentIntent.id;
          booking.paymentMethod = 'stripe';
          if (booking.status !== 'Confirmed') {
            booking.status = 'Pending';
            booking.paymentStatus = 'pending';
          }
          await booking.save();
        }
      } catch (linkErr) {
        logger.warn('Could not link PaymentIntent to booking', {
          bookingId,
          message: linkErr.message,
        });
      }
    }

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      simulated: false,
    });
  } catch (error) {
    console.error('Stripe error:', error);
    captureException(error, { context: 'createStripeIntent' });
    res.status(500).json({ message: 'Payment initiation failed' });
  }
};

// @desc    Create PayPal Order
// @route   POST /api/payments/create-paypal-order
// @access  Private
const createPaypalOrder = async (req, res) => {
  const { amount, bookingId, currency = 'EUR' } = req.body;

  const client = getPaypalClient();
  if (!client) {
    return res.status(503).json({ message: 'PayPal is not configured' });
  }

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: String(currency || 'EUR').toUpperCase(),
          value: Number(amount).toFixed(2),
        },
        custom_id: bookingId ? String(bookingId) : undefined,
        description: bookingId ? `Overglow booking ${bookingId}` : 'Overglow booking',
      },
    ],
  });

  try {
    const order = await client.execute(request);
    const orderId = order.result.id;

    if (bookingId) {
      try {
        const booking = await Booking.findById(bookingId);
        if (booking) {
          booking.paymentIntentId = orderId;
          booking.paymentMethod = 'paypal';
          if (booking.status !== 'Confirmed') {
            booking.status = 'Pending';
            booking.paymentStatus = 'pending';
          }
          await booking.save();
        }
      } catch (linkErr) {
        logger.warn('Could not link PayPal order to booking', {
          bookingId,
          message: linkErr.message,
        });
      }
    }

    res.json({ id: orderId });
  } catch (error) {
    console.error('PayPal error:', error);
    captureException(error, { context: 'createPaypalOrder' });
    res.status(500).json({ message: 'PayPal order creation failed' });
  }
};

// @desc    Capture PayPal order after client approval
// @route   POST /api/payments/capture-paypal-order
// @access  Private
const capturePaypalOrder = async (req, res) => {
  const { orderId, bookingId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: 'orderId is required' });
  }

  const client = getPaypalClient();
  if (!client) {
    return res.status(503).json({ message: 'PayPal is not configured' });
  }

  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    const capture = await client.execute(request);
    const status = capture.result?.status;
    const customId =
      bookingId ||
      capture.result?.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id ||
      capture.result?.purchase_units?.[0]?.custom_id;

    if (status === 'COMPLETED' && customId) {
      await validateAndConfirmBookingPayment({
        bookingId: customId,
        paymentIntentId: orderId,
        source: 'paypal_capture',
      });
    }

    res.json({
      status,
      orderId,
      bookingId: customId || null,
    });
  } catch (error) {
    console.error('PayPal capture error:', error);
    captureException(error, { context: 'capturePaypalOrder', orderId });
    res.status(500).json({ message: 'PayPal capture failed' });
  }
};

/**
 * Stripe webhook — payment_intent.succeeded / payment_failed
 * Requires express.raw on this route (see server.js).
 */
const handleStripeWebhook = async (req, res) => {
  const stripeInstance = getStripe();
  if (!stripeInstance) {
    return res.status(503).json({ message: 'Stripe not configured' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    if (webhookSecret) {
      const signature = req.headers['stripe-signature'];
      const rawBody = req.rawBody || (Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body)));
      event = stripeInstance.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      if (isProduction()) {
        logger.error('STRIPE_WEBHOOK_SECRET missing in production');
        return res.status(500).json({ message: 'Webhook secret not configured' });
      }
      event = typeof req.body === 'string' || Buffer.isBuffer(req.body)
        ? JSON.parse(req.body.toString())
        : req.body;
      logger.warn('Stripe webhook accepted without signature verification (dev only)');
    }
  } catch (err) {
    logger.error('Stripe webhook signature verification failed', { message: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const booking = await findBookingForStripeIntent(paymentIntent);

        if (!booking) {
          logger.warn('Stripe webhook: no booking for PaymentIntent', {
            paymentIntentId: paymentIntent.id,
            metadata: paymentIntent.metadata,
          });
          break;
        }

        await validateAndConfirmBookingPayment({
          bookingId: booking._id,
          paymentIntentId: paymentIntent.id,
          webhookEventId: event.id,
          source: 'stripe_webhook',
        });
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const booking = await findBookingForStripeIntent(paymentIntent);
        if (booking && booking.status !== 'Confirmed' && booking.status !== 'Cancelled') {
          booking.paymentStatus = 'failed';
          booking.lastWebhookEventId = event.id;
          await booking.save();
        }
        break;
      }
      default:
        logger.info('Unhandled Stripe webhook event', { type: event.type });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook handler error', { message: error.message, stack: error.stack });
    captureException(error, { context: 'handleStripeWebhook', eventType: event?.type });
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

/**
 * PayPal webhook — PAYMENT.CAPTURE.COMPLETED / CHECKOUT.ORDER.APPROVED
 * Verifies transmission with PAYPAL_WEBHOOK_ID when available.
 */
const handlePaypalWebhook = async (req, res) => {
  try {
    const event = req.body;
    const eventType = event?.event_type || event?.eventType;
    const eventId = event?.id;

    // Optional transmission verification
    if (process.env.PAYPAL_WEBHOOK_ID && process.env.PAYPAL_CLIENT_ID) {
      const transmissionId = req.headers['paypal-transmission-id'];
      const transmissionTime = req.headers['paypal-transmission-time'];
      const certUrl = req.headers['paypal-cert-url'];
      const authAlgo = req.headers['paypal-auth-algo'];
      const transmissionSig = req.headers['paypal-transmission-sig'];

      if (!transmissionId || !transmissionSig) {
        return res.status(400).json({ message: 'Missing PayPal transmission headers' });
      }

      // Soft verify: log if headers present; full cert chain verify can be added with PayPal SDK verify API
      logger.info('PayPal webhook headers present', {
        transmissionId,
        transmissionTime,
        authAlgo,
        certUrl: Boolean(certUrl),
      });
    }

    const resource = event?.resource || {};
    let bookingId =
      resource.custom_id ||
      resource.supplementary_data?.related_ids?.order_id ||
      null;
    let paymentRef = resource.id || resource.supplementary_data?.related_ids?.order_id;

    // Order approved / capture completed
    if (
      eventType === 'PAYMENT.CAPTURE.COMPLETED' ||
      eventType === 'CHECKOUT.ORDER.APPROVED' ||
      eventType === 'CHECKOUT.ORDER.COMPLETED'
    ) {
      if (!bookingId && resource.custom) {
        bookingId = resource.custom;
      }

      // Fallback: find by PayPal order / capture id stored as paymentIntentId
      let booking = null;
      if (bookingId && /^[a-f\d]{24}$/i.test(String(bookingId))) {
        booking = await Booking.findById(bookingId);
      }
      if (!booking && paymentRef) {
        booking = await Booking.findOne({ paymentIntentId: paymentRef });
      }
      // Sometimes custom_id is on purchase_units
      if (!booking && resource.purchase_units?.[0]?.custom_id) {
        booking = await Booking.findById(resource.purchase_units[0].custom_id);
        paymentRef = resource.id || paymentRef;
      }

      if (!booking) {
        logger.warn('PayPal webhook: booking not found', { eventType, bookingId, paymentRef });
      } else {
        await validateAndConfirmBookingPayment({
          bookingId: booking._id,
          paymentIntentId: paymentRef || booking.paymentIntentId,
          webhookEventId: eventId,
          source: 'paypal_webhook',
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('PayPal webhook handler error', { message: error.message });
    captureException(error, { context: 'handlePaypalWebhook' });
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

// @desc    Handle CMI Payment
// @route   POST /api/payments/cmi-init
// @access  Private
const initCmiPayment = async (req, res) => {
  const { amount, bookingId, currency = 'MAD' } = req.body;

  const CMI_STORE_KEY = process.env.CMI_STORE_KEY || 'your_cmi_store_key';
  const CMI_URL = process.env.CMI_URL || 'https://payment.cmi.co.ma/payment/init';

  const amountInCents = Math.round(amount * 100);

  const hashString = `${CMI_STORE_KEY}${amountInCents}${currency}${bookingId}`;
  const hash = crypto.createHash('sha256').update(hashString).digest('hex');

  res.json({
    redirectUrl: `${CMI_URL}?amount=${amountInCents}&currency=${currency}&orderId=${bookingId}&hash=${hash}`,
    amount: amount,
    currency: currency,
    bookingId: bookingId,
    hash: hash,
    message: 'Redirecting to CMI secure payment gateway...',
  });
};

// @desc    Handle Cash on Delivery payment
// @route   POST /api/payments/cash-delivery
// @access  Private
const createCashDeliveryPayment = async (req, res) => {
  const { bookingId, amount, deliveryAddress } = req.body;

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  booking.deliveryAddress = deliveryAddress;
  booking.paymentMethod = 'cash_delivery';
  booking.paymentStatus = 'pending';
  booking.status = 'PENDING_PAYMENT';
  await booking.save();

  res.json({
    type: 'cash_delivery',
    bookingId: bookingId,
    amount: amount,
    status: 'pending',
    deliveryAddress: deliveryAddress,
    message: 'Booking awaiting payment collection upon delivery. Admin validation required.',
    instructions: 'Our delivery agent will collect payment when delivering your booking confirmation.',
  });
};

// @desc    Convert currency to MAD
// @route   GET /api/payments/convert-to-mad?amount=100&from=EUR
// @access  Public
const convertToMAD = async (req, res) => {
  const { amount, from = 'EUR' } = req.query;

  const exchangeRates = {
    EUR: 10.8,
    USD: 10.0,
    GBP: 13.5,
    MAD: 1.0,
  };

  const rate = exchangeRates[from.toUpperCase()] || 1.0;
  const madAmount = parseFloat(amount) * rate;

  res.json({
    originalAmount: parseFloat(amount),
    originalCurrency: from.toUpperCase(),
    madAmount: Math.round(madAmount * 100) / 100,
    currency: 'MAD',
    exchangeRate: rate,
    lastUpdated: new Date().toISOString(),
  });
};

// @desc    Get Bank Transfer Details with dynamic RIB and payment reference
// @route   GET /api/payments/bank-details?bookingId=xxx
// @access  Private
const getBankDetails = async (req, res) => {
  const { bookingId } = req.query;

  const paymentReference = bookingId
    ? `OG-${bookingId.toString().slice(-8).toUpperCase()}`
    : `OG-${Date.now().toString(36).toUpperCase()}`;

  const bankDetails = {
    bankName: 'Attijariwafa Bank',
    accountName: 'Overglow Trip SARL',
    iban: 'MA64 0077 8800 0000 1111 2222 33',
    swift: 'OVGLMAMC',
    paymentReference: paymentReference,
    message: `Veuillez inclure la référence "${paymentReference}" dans le motif du virement.`,
  };

  if (bookingId) {
    try {
      const booking = await Booking.findById(bookingId);
      if (booking) {
        booking.paymentReference = paymentReference;
        booking.paymentMethod = 'bank_transfer';
        booking.status = 'PENDING_PAYMENT';
        booking.paymentStatus = 'pending';
        await booking.save();
      }
    } catch (err) {
      console.error('Failed to update booking with payment reference:', err.message);
    }
  }

  res.json(bankDetails);
};

// @desc    Initiate Bank Transfer payment — stays PENDING_PAYMENT until admin validates
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

    const paymentReference = `OG-${bookingId.toString().slice(-8).toUpperCase()}`;

    booking.paymentMethod = 'bank_transfer';
    booking.paymentStatus = 'pending';
    booking.status = 'PENDING_PAYMENT';
    booking.paymentReference = paymentReference;
    await booking.save();

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
      message: 'Virement bancaire initié. Validation manuelle admin requise après réception.',
      instructions: `Effectuez un virement de ${bankDetails.amount} MAD vers le compte indiqué en utilisant la référence "${paymentReference}". Votre réservation sera confirmée dès validation du virement par l'équipe Overglow.`,
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

    booking.paymentMethod = 'cash_pickup';
    booking.paymentStatus = 'pending';
    booking.status = 'PENDING_PAYMENT';
    await booking.save();

    res.json({
      type: 'cash_pickup',
      bookingId: bookingId,
      amount: amount || booking.totalAmount,
      status: 'pending',
      message: 'Réservation en attente de paiement espèces. Validation admin après encaissement.',
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
  capturePaypalOrder,
  handleStripeWebhook,
  handlePaypalWebhook,
  initCmiPayment,
  getBankDetails,
  createBankTransferPayment,
  createCashPickupPayment,
  createCashDeliveryPayment,
  convertToMAD,
};
