import Stripe from 'stripe';
import { logger } from '../utils/logger.js';
import { captureException } from '../utils/sentry.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const providerHasKeys = (provider) => {
  switch (provider) {
    case 'stripe':
      return Boolean(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder'));
    case 'paypal':
      return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
    case 'cmi':
      return Boolean(process.env.CMI_STORE_KEY && process.env.CMI_URL);
    default:
      return false;
  }
};

const buildSimulatedTransaction = ({ amount, currency, provider, metadata }) => ({
  success: true,
  simulated: true,
  provider,
  transactionId: `sim_${provider}_${Date.now()}`,
  amount,
  currency: currency || 'EUR',
  status: 'succeeded',
  metadata: metadata || {},
  processedAt: new Date().toISOString(),
});

export const processPayment = async ({
  provider = 'stripe',
  amount,
  currency = 'EUR',
  paymentIntentId,
  metadata = {},
}) => {
  try {
    if (process.env.SIMULATE_PAYMENT_FAILURE === '1') {
      await sleep(1000);
      throw new Error('Simulated payment failure');
    }

    if (!providerHasKeys(provider)) {
      await sleep(1000);
      logger.info('Payment simulated due to missing provider keys', { provider, amount, currency });
      return buildSimulatedTransaction({ amount, currency, provider, metadata });
    }

    if (provider === 'stripe') {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      let intent = null;

      if (paymentIntentId) {
        intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      } else {
        intent = await stripe.paymentIntents.create({
          amount: Math.round(Number(amount || 0) * 100),
          currency: String(currency || 'EUR').toLowerCase(),
          automatic_payment_methods: { enabled: true },
          metadata,
        });
      }

      return {
        success: true,
        simulated: false,
        provider,
        transactionId: intent.id,
        amount,
        currency,
        status: intent.status || 'requires_payment_method',
        clientSecret: intent.client_secret,
        metadata,
        processedAt: new Date().toISOString(),
      };
    }

    await sleep(1000);
    return buildSimulatedTransaction({ amount, currency, provider, metadata });
  } catch (error) {
    logger.error('Payment processing failed', {
      provider,
      amount,
      currency,
      message: error?.message,
    });
    captureException(error, { provider, amount, currency, paymentIntentId, metadata });
    throw error;
  }
};
