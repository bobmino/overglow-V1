import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { logger } from '../utils/logger.js';

const isPaymentSimEnabled =
  import.meta.env.PROD !== true &&
  ['1', 'true', 'yes', 'on'].includes(
    String(import.meta.env.VITE_ENABLE_PAYMENT_SIM || '').trim().toLowerCase()
  );

let _stripePromise = null;
const getStripePromise = () => {
  if (!_stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!key || key.includes('placeholder')) {
      _stripePromise = Promise.resolve(null);
      return _stripePromise;
    }
    _stripePromise = loadStripe(key).catch((err) => {
      logger.warn('Failed to load Stripe.js:', err.message);
      return null;
    });
  }
  return _stripePromise;
};

const StripeForm = ({ amountMad, bookingId, bookingIds, onSuccess, onError }) => {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!elements && !isPaymentSimEnabled) return;
    if (!stripe && !isPaymentSimEnabled) return;
    if (!bookingId && !(bookingIds && bookingIds.length)) {
      onError(t('payment.err_payment_failed'));
      return;
    }

    setProcessing(true);

    try {
      const {
        data: { clientSecret },
      } = await api.post('/api/payments/create-stripe-intent', {
        amount: amountMad,
        currency: 'mad',
        bookingId,
        bookingIds: bookingIds?.length ? bookingIds : undefined,
      });

      if (
        isPaymentSimEnabled &&
        typeof clientSecret === 'string' &&
        clientSecret.startsWith('mock_secret_')
      ) {
        setTimeout(() => {
          onSuccess({ type: 'stripe', id: `mock_payment_id_${Date.now()}` });
          setProcessing(false);
        }, 1500);
        return;
      }

      if (!stripe) {
        onError(t('payment.err_payment_failed'));
        setProcessing(false);
        return;
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        onError(result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        onSuccess({ type: 'stripe', id: result.paymentIntent.id });
      }
    } catch {
      onError(t('payment.err_payment_failed'));
    }
    setProcessing(false);
  };

  const payLabel =
    amountMad != null && Number.isFinite(Number(amountMad))
      ? `${Number(amountMad).toFixed(2)} MAD`
      : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label={t('payment.pay_card')}>
      <div className="p-4 border border-gray-300 rounded-lg">
        <p className="text-sm font-semibold text-gray-700 mb-2" id="card-element-label">
          {t('payment.card_label')}
        </p>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': { color: '#aab7c4' },
              },
              invalid: { color: '#9e2146' },
            },
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!stripe || processing || !payLabel}
        className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl font-bold hover:from-primary-700 hover:to-primary-800 disabled:bg-gray-400 transition-all shadow-lg shadow-emerald-200"
        aria-label={
          processing ? t('payment.pay_processing') : t('payment.pay_amount', { amount: payLabel })
        }
      >
        {processing ? t('payment.pay_processing') : t('payment.pay_amount', { amount: payLabel })}
      </button>
    </form>
  );
};

/**
 * Isolé + lazy : Stripe.js / iframes m.stripe.network ne se chargent
 * que si ce panneau est monté (carte activée au checkout).
 */
const StripeCardPanel = ({ amountMad, bookingId, bookingIds, onSuccess, onError }) => {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    setStripePromise(getStripePromise());
  }, []);

  if (!stripePromise) {
    return <p className="text-sm text-gray-500 text-center py-6">Chargement du paiement carte…</p>;
  }

  return (
    <Elements stripe={stripePromise}>
      <StripeForm
        amountMad={amountMad}
        bookingId={bookingId}
        bookingIds={bookingIds}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
};

export default StripeCardPanel;
