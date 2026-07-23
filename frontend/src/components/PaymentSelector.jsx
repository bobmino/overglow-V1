import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet, Banknote, Truck, Copy, CheckCircle, AlertCircle, Landmark } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { useCurrency } from '../context/CurrencyContext';
import { logger } from '../utils/logger.js';

/** [TASK-20] Simulator UI only when explicitly enabled outside production builds. */
const isPaymentSimEnabled =
  import.meta.env.PROD !== true &&
  ['1', 'true', 'yes', 'on'].includes(
    String(import.meta.env.VITE_ENABLE_PAYMENT_SIM || '').trim().toLowerCase()
  );

// FIX TDZ : Ne pas appeler loadStripe() au niveau module car cela cause un
// ReferenceError lors du build Vite si la variable est accédée avant initialisation.
// On utilise un pattern lazy : la Promise est créée une seule fois, au premier rendu.
let _stripePromise = null;
const getStripePromise = () => {
  if (!_stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!key || key.includes('placeholder')) {
      _stripePromise = Promise.resolve(null);
      return _stripePromise;
    }
    _stripePromise = loadStripe(key).catch((err) => {
      logger.warn('Failed to load Stripe.js. Payments via card will be unavailable:', err.message);
      return null;
    });
  }
  return _stripePromise;
};

const hasStripePublicKey = () => {
  const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  return Boolean(key && !key.includes('placeholder'));
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
      // Create PaymentIntent — bookingId requis (montant serveur)
      const { data: { clientSecret } } = await api.post('/api/payments/create-stripe-intent', {
        amount: amountMad,
        currency: 'mad',
        bookingId,
        bookingIds: bookingIds?.length ? bookingIds : undefined,
      });

      // Handle Mock Payment (dev + VITE_ENABLE_PAYMENT_SIM only)
      if (
        isPaymentSimEnabled &&
        typeof clientSecret === 'string' &&
        clientSecret.startsWith('mock_secret_')
      ) {
        setTimeout(() => {
          onSuccess({ type: 'stripe', id: 'mock_payment_id_' + Date.now() });
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
        }
      });

      if (result.error) {
        onError(result.error.message);
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          onSuccess({ type: 'stripe', id: result.paymentIntent.id });
        }
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
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!stripe || processing || !payLabel}
        className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl font-bold hover:from-primary-700 hover:to-primary-800 disabled:bg-gray-400 transition-all shadow-lg shadow-emerald-200"
        aria-label={processing ? t('payment.pay_processing') : t('payment.pay_amount', { amount: payLabel })}
      >
        {processing ? t('payment.pay_processing') : t('payment.pay_amount', { amount: payLabel })}
      </button>
    </form>
  );
};

const PaymentSelector = ({
  amount,
  currency = 'MAD',
  onPaymentComplete,
  bookingId,
  bookingIds,
  disabled,
}) => {
  const { t } = useTranslation();
  const { convert } = useCurrency();
  const [method, setMethod] = useState('cash_pickup');
  const [error, setError] = useState('');
  const [madAmount, setMadAmount] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [bankDetails, setBankDetails] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [copied, setCopied] = useState(false);
  const [loadingBankDetails, setLoadingBankDetails] = useState(false);
  const [methodFlags, setMethodFlags] = useState({
    stripeEnabled: false,
    cmiEnabled: false,
    paypalEnabled: false,
    bankTransferEnabled: true,
    showIban: true,
  });

  const selectMethod = (next) => {
    setError('');
    setMethod(next);
  };

  useEffect(() => {
    let cancelled = false;
    const loadFlags = async () => {
      const keys = ['stripeEnabled', 'cmiEnabled', 'paypalEnabled', 'bankTransferEnabled', 'showIban'];
      try {
        const results = await Promise.all(
          keys.map((key) =>
            api.get(`/api/settings/${key}`).then((r) => [key, r.data?.value]).catch(() => [key, undefined])
          )
        );
        if (cancelled) return;
        const next = { ...methodFlags };
        results.forEach(([key, value]) => {
          if (value !== undefined) next[key] = Boolean(value);
        });
        // Soft-launch: hide Stripe UI if no public key (évite CardElement cassé / CSP)
        if (!hasStripePublicKey() && !isPaymentSimEnabled) {
          next.stripeEnabled = false;
        }
        setMethodFlags(next);
      } catch (err) {
        logger.warn('Failed to load payment method flags:', err?.message || err);
      }
    };
    loadFlags();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  useEffect(() => {
    // Montants catalogue = MAD ; ne plus convertir en supposant EUR
    const resolveMadAmount = async () => {
      const n = Number(amount);
      if (!Number.isFinite(n) || n < 0) {
        setMadAmount(null);
        return;
      }
      const from = String(currency || 'MAD').toUpperCase();
      if (from === 'MAD') {
        setMadAmount(Math.round(n * 100) / 100);
        return;
      }
      try {
        const { data } = await api.get(
          `/api/payments/convert-to-mad?amount=${n}&from=${encodeURIComponent(from)}`
        );
        setMadAmount(data.madAmount);
      } catch (error) {
        logger.error('Failed to convert to MAD:', error);
        setMadAmount(null);
      }
    };
    resolveMadAmount();
  }, [amount, currency]);

  // Fetch bank details when bank transfer is selected
  useEffect(() => {
    if (method === 'bank' && bookingId && !bankDetails) {
      fetchBankDetails();
    }
  }, [method, bookingId]);

  const fetchBankDetails = async () => {
    setLoadingBankDetails(true);
    try {
      const { data } = await api.get(`/api/payments/bank-details?bookingId=${bookingId}`);
      setBankDetails(data);
      setPaymentReference(data.paymentReference || '');
    } catch (err) {
      logger.error('Failed to fetch bank details:', err);
      setError(t('payment.err_bank_details'));
    } finally {
      setLoadingBankDetails(false);
    }
  };

  const handleSuccess = (paymentDetails) => {
    onPaymentComplete(paymentDetails);
  };

  const handleError = (msg) => {
    setError(msg);
  };

  const handleBankTransfer = async () => {
    if (!bookingId) {
      handleSuccess({ type: 'bank_transfer', id: 'pending' });
      return;
    }
    try {
      const { data } = await api.post('/api/payments/bank-transfer', {
        bookingId,
        amount: madAmount || amount,
      });
      setBankDetails(data.bankDetails);
      setPaymentReference(data.paymentReference);
      handleSuccess({ type: 'bank_transfer', ...data });
    } catch (err) {
      handleError(err.response?.data?.message || t('payment.err_bank_init'));
    }
  };

  const handleCashPickup = async () => {
    if (bookingId) {
      try {
        const { data } = await api.post('/api/payments/cash-pickup', {
          bookingId,
          amount: madAmount || amount
        });
        handleSuccess({ type: 'cash_pickup', ...data });
      } catch (err) {
        handleError(err.response?.data?.message || t('payment.err_cash'));
      }
    } else {
      handleSuccess({ type: 'cash_pickup', id: 'cash_pickup_' + Date.now() });
    }
  };

  const handleCashDelivery = async () => {
    if (!deliveryAddress.trim()) {
      handleError(t('payment.err_delivery_addr'));
      return;
    }
    if (bookingId) {
      try {
        const { data } = await api.post('/api/payments/cash-delivery', {
          bookingId,
          amount: madAmount || amount,
          deliveryAddress
        });
        handleSuccess({ type: 'cash_delivery', ...data });
      } catch (err) {
        handleError(err.response?.data?.message || t('payment.err_delivery'));
      }
    } else {
      handleSuccess({
        type: 'cash_delivery',
        id: 'cash_delivery_' + Date.now(),
        deliveryAddress
      });
    }
  };

  const handleCMI = async () => {
    if (bookingId) {
      try {
        const { data } = await api.post('/api/payments/cmi-init', {
          amount: madAmount || amount,
          bookingId,
          currency: 'MAD'
        });
        handleSuccess({ type: 'cmi', ...data });
      } catch (err) {
        handleError(err.response?.data?.message || t('payment.err_cmi'));
      }
    } else {
      handleSuccess({ type: 'cmi', id: 'cmi_' + Date.now() });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formattedMadAmount =
    madAmount != null && Number.isFinite(Number(madAmount))
      ? Number(madAmount).toFixed(2)
      : null;
  const eurApprox =
    madAmount != null && Number.isFinite(Number(madAmount))
      ? Number(convert(madAmount, 'MAD', 'EUR')).toFixed(2)
      : Number(convert(amount, currency || 'MAD', 'EUR')).toFixed(2);
  const cmiPayAmount = formattedMadAmount
    ? `${formattedMadAmount} MAD`
    : `${eurApprox} EUR`;

  return (
    <div className="space-y-8">
      {/* Header with amount display */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">{t('payment.method_title')}</h3>
        {madAmount && (
          <div className="text-end backdrop-blur-md bg-white/60 rounded-xl px-5 py-3 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('payment.total_amount')}</p>
            <p className="text-2xl font-bold text-primary-700">{formattedMadAmount} MAD</p>
            <p className="text-xs text-gray-400">≈ {eurApprox} €</p>
          </div>
        )}
      </div>

      {/* Payment method selection grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" role="radiogroup" aria-label={t('payment.choose_method')}>
        {(methodFlags.stripeEnabled || isPaymentSimEnabled) && (
        <button
          type="button"
          onClick={() => selectMethod('stripe')}
          className={`p-5 border-2 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
            method === 'stripe'
              ? 'border-primary-500 bg-primary-50 shadow-lg shadow-emerald-100'
              : 'border-gray-200 hover:border-primary-300 hover:shadow-md bg-white'
          }`}
          role="radio"
          aria-checked={method === 'stripe'}
          aria-label={t('payment.aria_card')}
        >
          <CreditCard size={36} className={`mb-3 ${method === 'stripe' ? 'text-primary-600' : 'text-gray-400'}`} aria-hidden="true" />
          <span className="font-bold text-gray-800">{t('payment.card')}</span>
          <span className="text-xs text-gray-500 mt-1">{t('payment.card_hint')}</span>
        </button>
        )}

        {(methodFlags.paypalEnabled || isPaymentSimEnabled) && (import.meta.env.VITE_PAYPAL_CLIENT_ID || isPaymentSimEnabled) ? (
        <button
          type="button"
          onClick={() => selectMethod('paypal')}
          className={`p-5 border-2 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
            method === 'paypal'
              ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
              : 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-white'
          }`}
          role="radio"
          aria-checked={method === 'paypal'}
          aria-label={t('payment.aria_paypal')}
        >
          <Wallet size={36} className={`mb-3 ${method === 'paypal' ? 'text-blue-600' : 'text-gray-400'}`} aria-hidden="true" />
          <span className="font-bold text-gray-800">{t('payment.paypal')}</span>
          <span className="text-xs text-gray-500 mt-1">{t('payment.paypal_hint')}</span>
        </button>
        ) : null}

        <button
          type="button"
          onClick={() => selectMethod('cmi')}
          className={`p-5 border-2 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
            method === 'cmi'
              ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-100'
              : 'border-gray-200 hover:border-orange-300 hover:shadow-md bg-white'
          }`}
          role="radio"
          aria-checked={method === 'cmi'}
          aria-label={t('payment.aria_cmi')}
        >
          <CreditCard size={36} className={`mb-3 ${method === 'cmi' ? 'text-orange-600' : 'text-gray-400'}`} aria-hidden="true" />
          <span className="font-bold text-gray-800">{t('payment.cmi')}</span>
          <span className="text-xs text-gray-500 mt-1">{t('payment.cmi_hint')}</span>
        </button>

        <button
          type="button"
          onClick={() => selectMethod('cash_pickup')}
          className={`p-5 border-2 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
            method === 'cash_pickup'
              ? 'border-primary-500 bg-primary-50 shadow-lg shadow-green-100'
              : 'border-gray-200 hover:border-primary-300 hover:shadow-md bg-white'
          }`}
          role="radio"
          aria-checked={method === 'cash_pickup'}
          aria-label={t('payment.aria_cash')}
        >
          <Banknote size={36} className={`mb-3 ${method === 'cash_pickup' ? 'text-primary-600' : 'text-gray-400'}`} aria-hidden="true" />
          <span className="font-bold text-gray-800">{t('payment.cash')}</span>
          <span className="text-xs text-gray-500 mt-1">{t('payment.cash_hint')}</span>
        </button>

        <button
          type="button"
          onClick={() => selectMethod('cash_delivery')}
          className={`p-5 border-2 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
            method === 'cash_delivery'
              ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-100'
              : 'border-gray-200 hover:border-purple-300 hover:shadow-md bg-white'
          }`}
          role="radio"
          aria-checked={method === 'cash_delivery'}
          aria-label={t('payment.aria_delivery')}
        >
          <Truck size={36} className={`mb-3 ${method === 'cash_delivery' ? 'text-purple-600' : 'text-gray-400'}`} aria-hidden="true" />
          <span className="font-bold text-gray-800">{t('payment.delivery')}</span>
          <span className="text-xs text-gray-500 mt-1">{t('payment.delivery_hint')}</span>
        </button>

        {methodFlags.bankTransferEnabled !== false && (
        <button
          type="button"
          onClick={() => selectMethod('bank')}
          className={`p-5 border-2 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
            method === 'bank'
              ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100'
              : 'border-gray-200 hover:border-indigo-300 hover:shadow-md bg-white'
          }`}
          role="radio"
          aria-checked={method === 'bank'}
          aria-label={t('payment.aria_bank')}
        >
          <Landmark size={36} className={`mb-3 ${method === 'bank' ? 'text-indigo-600' : 'text-gray-400'}`} aria-hidden="true" />
          <span className="font-bold text-gray-800">{t('payment.bank')}</span>
          <span className="text-xs text-gray-500 mt-1">{t('payment.bank_hint')}</span>
        </button>
        )}
      </div>

      {error && (
        <div className="backdrop-blur-md bg-red-50/80 text-red-700 p-4 rounded-xl text-sm border border-red-200 flex items-center gap-3" role="alert" aria-live="assertive">
          <AlertCircle size={20} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Payment method detail panels */}
      <div className="mt-8">
        {method === 'stripe' && (
          <div className="backdrop-blur-md bg-white/80 rounded-2xl p-8 shadow-xl border border-gray-200">
            {hasStripePublicKey() || isPaymentSimEnabled ? (
              <Elements stripe={getStripePromise()}>
                <StripeForm
                  amountMad={madAmount ?? amount}
                  bookingId={bookingId}
                  bookingIds={bookingIds}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              </Elements>
            ) : (
              <div className="text-center space-y-3">
                <AlertCircle size={40} className="mx-auto text-amber-600" />
                <p className="font-bold text-gray-900">Paiement carte bientôt disponible</p>
                <p className="text-sm text-gray-600">
                  Stripe n’est pas encore branché. Utilisez <strong>Espèces</strong> ou{' '}
                  <strong>Virement</strong> pour finaliser votre réservation.
                </p>
              </div>
            )}
          </div>
        )}

        {method === 'paypal' && (
          <div className="backdrop-blur-md bg-white/80 rounded-2xl p-8 shadow-xl border border-gray-200 text-center">
            <Wallet size={48} className="mx-auto mb-4 text-blue-600" />
            <p className="mb-6 text-gray-600 text-lg">{t('payment.paypal_redirect')}</p>
            {isPaymentSimEnabled ? (
              <button
                type="button"
                onClick={() => handleSuccess({ type: 'paypal', id: `mock_paypal_${Date.now()}` })}
                className="w-full bg-[#0070ba] text-white py-4 rounded-xl font-bold hover:bg-[#003087] transition-all shadow-lg"
              >
                {t('payment.pay_paypal')} (sim)
              </button>
            ) : (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4">
                {t('payment.err_payment_failed')}
              </p>
            )}
          </div>
        )}

        {method === 'cmi' && (
          <div className="backdrop-blur-md bg-orange-50/80 rounded-2xl p-8 shadow-xl border border-orange-200">
            <div className="mb-6 text-center">
              <CreditCard size={48} className="mx-auto mb-4 text-orange-600" />
              <p className="text-gray-700 font-bold text-xl mb-2">{t('payment.cmi_title')}</p>
              <p className="text-sm text-gray-600 mb-4">
                {methodFlags.cmiEnabled
                  ? 'Vous serez redirigé vers la page sécurisée CMI pour saisir les détails de votre carte (Visa/Mastercard marocaines). Aucune saisie carte sur Overglow.'
                  : 'CMI n’est pas encore activé (soft-launch). Les détails de carte se saisissent uniquement sur la page banque CMI — pas sur Overglow. Utilisez Espèces ou Virement pour réserver maintenant.'}
              </p>
              {madAmount && (
                <div className="backdrop-blur-md bg-white/60 rounded-xl p-4 border border-orange-200 inline-block">
                  <p className="text-sm text-gray-500">{t('payment.amount_to_pay')}</p>
                  <p className="text-3xl font-bold text-orange-700">{formattedMadAmount} MAD</p>
                </div>
              )}
            </div>
            {methodFlags.cmiEnabled ? (
              <>
                <button
                  type="button"
                  onClick={handleCMI}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4 rounded-xl font-bold hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg shadow-orange-200"
                  aria-label={t('payment.pay_cmi_aria', { amount: cmiPayAmount })}
                >
                  {t('payment.pay_cmi')}
                </button>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  {t('payment.cmi_accepts')}
                </p>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => selectMethod('cash_pickup')}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-bold"
                >
                  {t('payment.cash')}
                </button>
                <button
                  type="button"
                  onClick={() => selectMethod('bank')}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 rounded-xl font-bold"
                >
                  {t('payment.bank')}
                </button>
              </div>
            )}
          </div>
        )}

        {method === 'cash_pickup' && (
          <div className="backdrop-blur-md bg-primary-50/80 rounded-2xl p-8 shadow-xl border border-primary-200">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Banknote size={40} className="text-primary-600" />
                <h4 className="font-bold text-gray-900 text-xl">{t('payment.cash_title')}</h4>
              </div>
              <p className="text-gray-700 mb-4">
                {t('payment.cash_body')}
              </p>
              {madAmount && (
                <div className="backdrop-blur-md bg-white/60 rounded-xl p-5 border border-primary-200">
                  <p className="text-sm text-gray-500 uppercase tracking-wide">{t('payment.amount_to_pay')}</p>
                  <p className="text-3xl font-bold text-primary-700">{formattedMadAmount} MAD</p>
                </div>
              )}
            </div>
            <div className="backdrop-blur-md bg-amber-50/80 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  {t('payment.cash_warning')}
                </p>
              </div>
            </div>
            <button
              onClick={handleCashPickup}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-200"
              aria-label={t('payment.confirm_cash')}
            >
              {t('payment.confirm_cash')}
            </button>
          </div>
        )}

        {method === 'cash_delivery' && (
          <div className="backdrop-blur-md bg-purple-50/80 rounded-2xl p-8 shadow-xl border border-purple-200">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Truck size={40} className="text-purple-600" />
                <h4 className="font-bold text-gray-900 text-xl">{t('payment.delivery_title')}</h4>
              </div>
              <p className="text-gray-700 mb-4">
                {t('payment.delivery_body')}
              </p>
              {madAmount && (
                <div className="backdrop-blur-md bg-white/60 rounded-xl p-5 border border-purple-200 mb-6">
                  <p className="text-sm text-gray-500 uppercase tracking-wide">{t('payment.amount_to_pay')}</p>
                  <p className="text-3xl font-bold text-purple-700">{formattedMadAmount} MAD</p>
                </div>
              )}
            </div>
            <div className="mb-6">
              <label htmlFor="delivery-address" className="block text-sm font-bold text-gray-700 mb-2">
                {t('payment.delivery_address')}
              </label>
              <textarea
                id="delivery-address"
                name="delivery-address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder={t('payment.delivery_placeholder')}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none backdrop-blur-md bg-white/80"
                required
                autoComplete="street-address"
                aria-required="true"
              />
            </div>
            <div className="backdrop-blur-md bg-amber-50/80 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  {t('payment.delivery_warning')}
                </p>
              </div>
            </div>
            <button
              onClick={handleCashDelivery}
              disabled={!deliveryAddress.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-200 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              aria-label={t('payment.confirm_delivery')}
            >
              {t('payment.confirm_delivery')}
            </button>
          </div>
        )}

        {method === 'bank' && (
          <div className="backdrop-blur-md bg-indigo-50/80 rounded-2xl p-8 shadow-xl border border-indigo-200">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Landmark size={40} className="text-indigo-600" />
                <h4 className="font-bold text-gray-900 text-xl">{t('payment.bank_title')}</h4>
              </div>
              <p className="text-gray-700 mb-6">
                {t('payment.bank_body')}
              </p>

              {loadingBankDetails ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                  <p className="text-gray-500 mt-3">{t('payment.bank_loading')}</p>
                </div>
              ) : (
                <>
                  {/* Bank Details Card */}
                  <div className="backdrop-blur-md bg-white/80 rounded-xl p-6 border border-indigo-200 mb-6">
                    <h5 className="font-bold text-gray-800 mb-4 text-lg">{t('payment.bank_details')}</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">{t('payment.bank_name')}</span>
                        <span className="font-semibold text-gray-800">{bankDetails?.bankName || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">{t('payment.bank_account')}</span>
                        <span className="font-semibold text-gray-800">{bankDetails?.accountName || '—'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">{t('payment.bank_iban')}</span>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-semibold text-gray-800 text-sm break-all">
                            {methodFlags.showIban === false
                              ? '•••• (masqué)'
                              : bankDetails?.iban || t('payment.bank_not_configured')}
                          </span>
                          {methodFlags.showIban !== false && bankDetails?.iban ? (
                            <button
                              onClick={() => copyToClipboard(bankDetails.iban)}
                              className="p-2 rounded-lg hover:bg-indigo-100 transition-colors shrink-0 min-h-11 min-w-11 inline-flex items-center justify-center"
                              aria-label={copied ? t('payment.bank_copied') : t('payment.bank_copy')}
                              type="button"
                            >
                              {copied ? <CheckCircle size={16} className="text-primary-600" /> : <Copy size={16} className="text-indigo-600" />}
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">{t('payment.bank_swift')}</span>
                        <span className="font-mono font-semibold text-gray-800">{bankDetails?.swift || t('payment.bank_not_configured')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Reference Card */}
                  <div className="backdrop-blur-md bg-primary-50/80 rounded-xl p-6 border border-primary-200 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle size={24} className="text-primary-600" />
                      <h5 className="font-bold text-gray-800 text-lg">{t('payment.bank_ref')}</h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {t('payment.bank_instructions')}
                    </p>
                    <div className="flex items-center justify-between backdrop-blur-md bg-white/80 rounded-lg p-4 border border-primary-200">
                      <span className="font-mono text-xl font-bold text-primary-700 tracking-wider">
                        {paymentReference || bankDetails?.paymentReference || 'OG-XXXXXXXX'}
                      </span>
                      <button
                        onClick={() => copyToClipboard(paymentReference || bankDetails?.paymentReference || '')}
                        className="p-2 rounded-lg hover:bg-primary-100 transition-colors"
                        aria-label={copied ? t('payment.bank_copied') : t('payment.bank_copy_ref')}
                      >
                        {copied ? <CheckCircle size={20} className="text-primary-600" /> : <Copy size={20} className="text-primary-600" />}
                      </button>
                    </div>
                  </div>

                  {/* Amount Card */}
                  {madAmount && (
                    <div className="backdrop-blur-md bg-white/80 rounded-xl p-5 border border-indigo-200 mb-6">
                      <p className="text-sm text-gray-500 uppercase tracking-wide">{t('payment.bank_amount_transfer')}</p>
                      <p className="text-3xl font-bold text-indigo-700">{formattedMadAmount} MAD</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="backdrop-blur-md bg-amber-50/80 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">{t('payment.bank_processing_title')}</p>
                  <p>{t('payment.bank_processing_body')}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleBankTransfer}
              disabled={loadingBankDetails}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-4 rounded-xl font-bold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-200 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              aria-label={t('payment.confirm_bank')}
            >
              {t('payment.confirm_bank')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSelector;
