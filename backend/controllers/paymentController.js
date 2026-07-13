import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';
import crypto from 'crypto';
import Booking from '../models/bookingModel.js';
import { validateAndConfirmBookingPayment } from '../services/bookingPaymentService.js';
import {
  verifyPaypalWebhookSignature,
  extractPaypalWebhookAmount,
} from '../services/paypalWebhookService.js';
import { validatePaymentAmount } from '../utils/paymentAmount.js';
import { getCmiStoreKey, getBankCredentials } from '../config/paymentEnv.js';
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
      logger.error('Failed to initialize Stripe:', error.message);
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
      logger.error('Failed to initialize PayPal:', error.message);
    }
  }
  return paypalClient;
};

/**
 * Charge le booking et valide le montant client vs totalAmount (tolérance 0.01).
 * [TASK-2] Empêche le underpayment via montant manipulé côté client.
 */
const loadBookingAndAssertAmount = async (bookingId, clientAmount, { requireReceived = false } = {}) => {
  if (!bookingId) {
    const err = new Error('Booking ID is required');
    err.statusCode = 400;
    throw err;
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }

  const check = validatePaymentAmount({
    expected: booking.totalAmount,
    received: clientAmount,
    requireReceived,
  });

  if (!check.ok) {
    logger.error('Payment amount validation failed', {
      bookingId: String(bookingId),
      reason: check.reason,
      expected: check.expected,
      received: check.received,
    });
    const err = new Error(check.reason);
    err.statusCode = 400;
    err.meta = { expected: check.expected, received: check.received };
    throw err;
  }

  return { booking, amount: check.expected };
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

  try {
    // [TASK-2] Montant serveur = booking.totalAmount (pas le montant client)
    const { booking, amount: chargeAmount } = await loadBookingAndAssertAmount(bookingId, amount, {
      requireReceived: Boolean(amount != null && amount !== ''),
    });

    if (!isStripeConfigured()) {
      if (isProduction()) {
        return res.status(503).json({ message: 'Stripe n\'est pas configuré en production' });
      }
      logger.warn('Using mock Stripe PaymentIntent (dev only)');
      return res.json({
        clientSecret: `mock_secret_${Date.now()}`,
        paymentIntentId: `mock_pi_${Date.now()}`,
        amount: chargeAmount,
        simulated: true,
      });
    }

    const stripeInstance = getStripe();
    if (!stripeInstance) {
      if (isProduction()) {
        return res.status(503).json({ message: 'Stripe indisponible' });
      }
      return res.json({
        clientSecret: `mock_secret_${Date.now()}`,
        paymentIntentId: `mock_pi_${Date.now()}`,
        amount: chargeAmount,
        simulated: true,
      });
    }

    const metadata = {
      userId: req.user?._id?.toString() || '',
      bookingId: String(bookingId),
    };

    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: Math.round(Number(chargeAmount) * 100),
      currency: String(currency || 'eur').toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
    });

    booking.paymentIntentId = paymentIntent.id;
    booking.paymentMethod = 'stripe';
    if (booking.status !== 'Confirmed') {
      booking.status = 'Pending';
      booking.paymentStatus = 'pending';
    }
    await booking.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: chargeAmount,
      simulated: false,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
        ...(error.meta || {}),
      });
    }
    logger.error('Stripe error:', error);
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

  try {
    // [TASK-2] Montant serveur = booking.totalAmount
    const { booking, amount: chargeAmount } = await loadBookingAndAssertAmount(bookingId, amount, {
      requireReceived: Boolean(amount != null && amount !== ''),
    });

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: String(currency || 'EUR').toUpperCase(),
            value: Number(chargeAmount).toFixed(2),
          },
          custom_id: String(bookingId),
          description: `Overglow booking ${bookingId}`,
        },
      ],
    });

    const order = await client.execute(request);
    const orderId = order.result.id;

    booking.paymentIntentId = orderId;
    booking.paymentMethod = 'paypal';
    if (booking.status !== 'Confirmed') {
      booking.status = 'Pending';
      booking.paymentStatus = 'pending';
    }
    await booking.save();

    res.json({ id: orderId, amount: chargeAmount });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
        ...(error.meta || {}),
      });
    }
    logger.error('PayPal error:', error);
    captureException(error, { context: 'createPaypalOrder' });
    res.status(500).json({ message: 'PayPal order creation failed' });
  }
};

// @desc    Capture PayPal order after client approval (verifyPayPalSuccess)
// @route   POST /api/payments/capture-paypal-order
// @access  Private
const capturePaypalOrder = async (req, res) => {
  const { orderId, bookingId, amount } = req.body;

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

    const capturedValue =
      capture.result?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value
      || capture.result?.purchase_units?.[0]?.amount?.value
      || amount;

    if (status === 'COMPLETED' && customId) {
      // [TASK-2] Revalide le montant capturé vs booking
      await loadBookingAndAssertAmount(customId, capturedValue, { requireReceived: true });

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
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
        ...(error.meta || {}),
      });
    }
    logger.error('PayPal capture error:', error);
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

        // [TASK-2] Montant Stripe (cents) vs booking.totalAmount
        const paidMajor = Number(paymentIntent.amount_received ?? paymentIntent.amount) / 100;
        const amountCheck = validatePaymentAmount({
          expected: booking.totalAmount,
          received: paidMajor,
          requireReceived: true,
        });
        if (!amountCheck.ok) {
          logger.error('Stripe webhook amount mismatch — refusing confirmation', {
            bookingId: booking._id.toString(),
            reason: amountCheck.reason,
            expected: amountCheck.expected,
            received: amountCheck.received,
            paymentIntentId: paymentIntent.id,
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
 * [TASK-2] Vérifie obligatoirement la signature PayPal (headers Transmission-*).
 */
const handlePaypalWebhook = async (req, res) => {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    if (!webhookId) {
      if (isProduction()) {
        logger.error('PAYPAL_WEBHOOK_ID missing in production — rejecting webhook');
        return res.status(500).json({ message: 'Webhook not configured' });
      }
      logger.warn('PayPal webhook accepted without signature verification (dev only — set PAYPAL_WEBHOOK_ID)');
    } else {
      const verification = await verifyPaypalWebhookSignature({
        headers: req.headers,
        body: req.body,
        webhookId,
      });

      if (!verification.ok) {
        logger.error('PayPal webhook signature verification failed', {
          reason: verification.reason,
        });
        return res.status(400).json({
          message: 'Invalid PayPal webhook signature',
          reason: verification.reason,
        });
      }
    }

    const event = req.body;
    const eventType = event?.event_type || event?.eventType;
    const eventId = event?.id;

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
        const paidAmount = extractPaypalWebhookAmount(event);
        const amountCheck = validatePaymentAmount({
          expected: booking.totalAmount,
          received: paidAmount,
          requireReceived: paidAmount != null,
        });

        if (!amountCheck.ok) {
          logger.error('PayPal webhook amount mismatch — refusing confirmation', {
            bookingId: booking._id.toString(),
            reason: amountCheck.reason,
            expected: amountCheck.expected,
            received: amountCheck.received,
            eventId,
          });
        } else {
          await validateAndConfirmBookingPayment({
            bookingId: booking._id,
            paymentIntentId: paymentRef || booking.paymentIntentId,
            webhookEventId: eventId,
            source: 'paypal_webhook',
          });
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('PayPal webhook handler error', { message: error.message });
    captureException(error, { context: 'handlePaypalWebhook' });
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

// @desc    Handle CMI Payment (verifyCMISuccess / init)
// @route   POST /api/payments/cmi-init
// @access  Private
const initCmiPayment = async (req, res) => {
  const { amount, bookingId, currency = 'MAD' } = req.body;

  try {
    // [TASK-2] Montant serveur = booking.totalAmount
    const { amount: chargeAmount } = await loadBookingAndAssertAmount(bookingId, amount, {
      requireReceived: Boolean(amount != null && amount !== ''),
    });

    // [TASK-3] Pas de fallback hardcodé — clé obligatoire depuis l'env
    let CMI_STORE_KEY;
    try {
      CMI_STORE_KEY = getCmiStoreKey();
    } catch (envErr) {
      return res.status(503).json({ message: envErr.message });
    }

    const CMI_URL = process.env.CMI_URL || 'https://payment.cmi.co.ma/payment/init';
    const amountInCents = Math.round(chargeAmount * 100);
    const timestamp = Date.now().toString();

    // [TASK-3] Séparateur '|' obligatoire : sans séparateur, "12"+"3" == "1"+"23" (collision de hash).
    // Chaque champ est délimité pour que le hash soit injectif sur les paramètres.
    const hashString = [amountInCents, currency, bookingId, CMI_STORE_KEY, timestamp].join('|');
    const hash = crypto.createHash('sha256').update(hashString).digest('hex');

    res.json({
      redirectUrl: `${CMI_URL}?amount=${amountInCents}&currency=${currency}&orderId=${bookingId}&timestamp=${timestamp}&hash=${hash}`,
      amount: chargeAmount,
      currency: currency,
      bookingId: bookingId,
      timestamp,
      hash: hash,
      message: 'Redirecting to CMI secure payment gateway...',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
        ...(error.meta || {}),
      });
    }
    captureException(error, { context: 'initCmiPayment' });
    res.status(500).json({ message: 'CMI payment initiation failed' });
  }
};

// @desc    Handle Cash on Delivery payment
// @route   POST /api/payments/cash-delivery
// @access  Private
const createCashDeliveryPayment = async (req, res) => {
  const { bookingId, amount, deliveryAddress } = req.body;

  try {
    const { booking, amount: chargeAmount } = await loadBookingAndAssertAmount(bookingId, amount);

    booking.deliveryAddress = deliveryAddress;
    booking.paymentMethod = 'cash_delivery';
    booking.paymentStatus = 'pending';
    booking.status = 'PENDING_PAYMENT';
    await booking.save();

    res.json({
      type: 'cash_delivery',
      bookingId: bookingId,
      amount: chargeAmount,
      status: 'pending',
      deliveryAddress: deliveryAddress,
      message: 'Booking awaiting payment collection upon delivery. Admin validation required.',
      instructions: 'Our delivery agent will collect payment when delivering your booking confirmation.',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
        ...(error.meta || {}),
      });
    }
    res.status(500).json({ message: 'Failed to process cash delivery payment' });
  }
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

  let credentials;
  try {
    credentials = getBankCredentials();
  } catch (envErr) {
    // Ne jamais logger IBAN/SWIFT
    logger.error('Bank credentials not configured');
    return res.status(503).json({ message: envErr.message });
  }

  const paymentReference = bookingId
    ? `OG-${bookingId.toString().slice(-8).toUpperCase()}`
    : `OG-${Date.now().toString(36).toUpperCase()}`;

  // [TASK-3] IBAN/SWIFT depuis l'environnement uniquement
  const bankDetails = {
    bankName: credentials.bankName,
    accountName: credentials.accountName,
    iban: credentials.iban,
    swift: credentials.swift,
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
        bankDetails.amount = booking.totalAmount;
        bankDetails.currency = 'MAD';
      }
    } catch (err) {
      logger.error('Failed to update booking with payment reference:', err.message);
    }
  }

  res.json(bankDetails);
};

// @desc    Initiate Bank Transfer payment — stays PENDING_PAYMENT until admin validates
// @route   POST /api/payments/bank-transfer
// @access  Private
const createBankTransferPayment = async (req, res) => {
  const { bookingId, amount } = req.body;

  try {
    // [TASK-2] Montant serveur = booking.totalAmount
    const { booking, amount: chargeAmount } = await loadBookingAndAssertAmount(bookingId, amount);

    const paymentReference = `OG-${bookingId.toString().slice(-8).toUpperCase()}`;

    booking.paymentMethod = 'bank_transfer';
    booking.paymentStatus = 'pending';
    booking.status = 'PENDING_PAYMENT';
    booking.paymentReference = paymentReference;
    await booking.save();

    let credentials;
    try {
      credentials = getBankCredentials();
    } catch (envErr) {
      logger.error('Bank credentials not configured');
      return res.status(503).json({ message: envErr.message });
    }

    // [TASK-3] IBAN/SWIFT depuis l'environnement — jamais hardcodés
    const bankDetails = {
      bankName: credentials.bankName,
      accountName: credentials.accountName,
      iban: credentials.iban,
      swift: credentials.swift,
      paymentReference: paymentReference,
      amount: chargeAmount,
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
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
        ...(error.meta || {}),
      });
    }
    logger.error('Bank transfer payment error:', error);
    res.status(500).json({ message: 'Failed to initiate bank transfer payment' });
  }
};

// @desc    Confirm Cash Pickup payment (mark booking as PENDING_PAYMENT)
// @route   POST /api/payments/cash-pickup
// @access  Private
const createCashPickupPayment = async (req, res) => {
  const { bookingId, amount } = req.body;

  try {
    const { booking, amount: chargeAmount } = await loadBookingAndAssertAmount(bookingId, amount);

    booking.paymentMethod = 'cash_pickup';
    booking.paymentStatus = 'pending';
    booking.status = 'PENDING_PAYMENT';
    await booking.save();

    res.json({
      type: 'cash_pickup',
      bookingId: bookingId,
      amount: chargeAmount,
      status: 'pending',
      message: 'Réservation en attente de paiement espèces. Validation admin après encaissement.',
      instructions: 'Veuillez apporter le montant exact en espèces. Le paiement sera collecté au point de rendez-vous.',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
        ...(error.meta || {}),
      });
    }
    logger.error('Cash pickup payment error:', error);
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
