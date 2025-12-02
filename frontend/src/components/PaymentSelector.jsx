import React, { useState, useEffect } from 'react';
import { CreditCard, Building, Wallet, Banknote, Truck } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../config/axios';

// Initialize Stripe (replace with your publishable key)
const stripePromise = loadStripe('pk_test_placeholder');

const StripeForm = ({ amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      // Create PaymentIntent
      const { data: { clientSecret } } = await api.post('/api/payments/create-stripe-intent', {
        amount,
        currency: 'eur'
      });

      // Handle Mock Payment
      if (clientSecret === 'mock_secret_for_testing') {
        setTimeout(() => {
          onSuccess({ type: 'stripe', id: 'mock_payment_id_' + Date.now() });
          setProcessing(false);
        }, 1500); // Simulate network delay
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
    } catch (err) {
      onError('Payment failed');
    }
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-300 rounded-lg">
        <CardElement options={{
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
        }} />
      </div>
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400"
      >
        {processing ? 'Processing...' : `Pay €${amount.toFixed(2)}`}
      </button>
    </form>
  );
};

const PaymentSelector = ({ amount, onPaymentComplete, bookingId }) => {
  const [method, setMethod] = useState('stripe');
  const [error, setError] = useState('');
  const [madAmount, setMadAmount] = useState(null);
  const [showMad, setShowMad] = useState(true);
  const [deliveryAddress, setDeliveryAddress] = useState('');

  useEffect(() => {
    // Fetch MAD conversion
    const fetchMadConversion = async () => {
      try {
        const { data } = await api.get(`/api/payments/convert-to-mad?amount=${amount}&from=EUR`);
        setMadAmount(data.madAmount);
      } catch (error) {
        console.error('Failed to convert to MAD:', error);
      }
    };
    fetchMadConversion();
  }, [amount]);

  const handleSuccess = (paymentDetails) => {
    onPaymentComplete(paymentDetails);
  };

  const handleError = (msg) => {
    setError(msg);
  };

  const handleCashPickup = async () => {
    try {
      const { data } = await api.post('/api/payments/cash-pickup', {
        bookingId,
        amount: madAmount || amount
      });
      handleSuccess({ type: 'cash_pickup', ...data });
    } catch (err) {
      handleError(err.response?.data?.message || 'Failed to process cash pickup payment');
    }
  };

  const handleCashDelivery = async () => {
    if (!deliveryAddress.trim()) {
      handleError('Please provide a delivery address');
      return;
    }
    try {
      const { data } = await api.post('/api/payments/cash-delivery', {
        bookingId,
        amount: madAmount || amount,
        deliveryAddress
      });
      handleSuccess({ type: 'cash_delivery', ...data });
    } catch (err) {
      handleError(err.response?.data?.message || 'Failed to process cash delivery payment');
    }
  };

  const handleCMI = async () => {
    try {
      const { data } = await api.post('/api/payments/cmi-init', {
        amount: madAmount || amount,
        bookingId,
        currency: 'MAD'
      });
      // In production, redirect to CMI gateway
      // For now, simulate success
      handleSuccess({ type: 'cmi', ...data });
    } catch (err) {
      handleError(err.response?.data?.message || 'Failed to initialize CMI payment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Méthode de Paiement</h3>
        {madAmount && (
          <div className="text-right">
            <p className="text-sm text-gray-600">Prix en MAD</p>
            <p className="text-lg font-bold text-primary-600">{madAmount.toFixed(2)} MAD</p>
            <p className="text-xs text-gray-500">≈ {amount.toFixed(2)} €</p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <button
          onClick={() => setMethod('stripe')}
          className={`p-4 border-2 rounded-xl flex flex-col items-center justify-center transition ${
            method === 'stripe' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <CreditCard size={32} className="mb-2 text-blue-600" />
          <span className="font-semibold">Card (Stripe)</span>
        </button>

        <button
          onClick={() => setMethod('paypal')}
          className={`p-4 border-2 rounded-xl flex flex-col items-center justify-center transition ${
            method === 'paypal' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <Wallet size={32} className="mb-2 text-blue-800" />
          <span className="font-semibold">PayPal</span>
        </button>

        <button
          onClick={() => setMethod('cmi')}
          className={`p-4 border-2 rounded-xl flex flex-col items-center justify-center transition ${
            method === 'cmi' ? 'border-orange-600 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
          }`}
        >
          <CreditCard size={32} className="mb-2 text-orange-600" />
          <span className="font-semibold text-sm">CMI</span>
          <span className="text-xs text-gray-600 mt-1">Cartes Marocaines</span>
        </button>

        <button
          onClick={() => setMethod('cash_pickup')}
          className={`p-4 border-2 rounded-xl flex flex-col items-center justify-center transition ${
            method === 'cash_pickup' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-300'
          }`}
        >
          <Banknote size={32} className="mb-2 text-green-600" />
          <span className="font-semibold text-sm">Espèces</span>
          <span className="text-xs text-gray-600 mt-1">Sur place</span>
        </button>

        <button
          onClick={() => setMethod('cash_delivery')}
          className={`p-4 border-2 rounded-xl flex flex-col items-center justify-center transition ${
            method === 'cash_delivery' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
          }`}
        >
          <Truck size={32} className="mb-2 text-purple-600" />
          <span className="font-semibold text-sm">À la livraison</span>
          <span className="text-xs text-gray-600 mt-1">Paiement à la livraison</span>
        </button>

        <button
          onClick={() => setMethod('bank')}
          className={`p-4 border-2 rounded-xl flex flex-col items-center justify-center transition ${
            method === 'bank' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <Building size={32} className="mb-2 text-gray-600" />
          <span className="font-semibold text-sm">Virement</span>
          <span className="text-xs text-gray-600 mt-1">Bancaire</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mt-6">
        {method === 'stripe' && (
          <Elements stripe={stripePromise}>
            <StripeForm amount={amount} onSuccess={handleSuccess} onError={handleError} />
          </Elements>
        )}

        {method === 'paypal' && (
          <div className="text-center p-6 bg-gray-50 rounded-xl">
            <p className="mb-4 text-gray-600">You will be redirected to PayPal to complete your payment.</p>
            <button
              onClick={() => handleSuccess({ type: 'paypal', id: 'mock_paypal_id' })}
              className="w-full bg-[#0070ba] text-white py-3 rounded-lg font-bold hover:bg-[#003087]"
            >
              Pay with PayPal
            </button>
          </div>
        )}

        {method === 'cmi' && (
          <div className="text-center p-6 bg-orange-50 rounded-xl border border-orange-200">
            <div className="mb-4">
              <p className="text-gray-700 font-semibold mb-2">Paiement sécurisé CMI</p>
              <p className="text-sm text-gray-600 mb-3">
                Vous serez redirigé vers la passerelle de paiement sécurisée CMI pour finaliser votre paiement.
              </p>
              {madAmount && (
                <p className="text-lg font-bold text-orange-700">
                  Montant: {madAmount.toFixed(2)} MAD
                </p>
              )}
            </div>
            <button
              onClick={handleCMI}
              className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition"
            >
              Payer avec CMI
            </button>
            <p className="text-xs text-gray-500 mt-3">
              Accepte toutes les cartes bancaires marocaines (Visa, Mastercard, CMI)
            </p>
          </div>
        )}

        {method === 'cash_pickup' && (
          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <div className="mb-4">
              <h4 className="font-bold text-gray-900 mb-2">Paiement en Espèces sur Place</h4>
              <p className="text-sm text-gray-700 mb-3">
                Vous paierez en espèces directement à l'arrivée au point de rendez-vous.
              </p>
              {madAmount && (
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">Montant à payer:</p>
                  <p className="text-2xl font-bold text-green-700">{madAmount.toFixed(2)} MAD</p>
                </div>
              )}
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800">
                ⚠️ Veuillez apporter le montant exact en espèces. Le paiement sera collecté au point de rendez-vous.
              </p>
            </div>
            <button
              onClick={handleCashPickup}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition"
            >
              Confirmer - Paiement sur Place
            </button>
          </div>
        )}

        {method === 'cash_delivery' && (
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <div className="mb-4">
              <h4 className="font-bold text-gray-900 mb-2">Paiement à la Livraison</h4>
              <p className="text-sm text-gray-700 mb-3">
                Le paiement sera collecté lors de la livraison de votre confirmation de réservation.
              </p>
              {madAmount && (
                <div className="bg-white p-4 rounded-lg border border-purple-200 mb-4">
                  <p className="text-sm text-gray-600">Montant à payer:</p>
                  <p className="text-2xl font-bold text-purple-700">{madAmount.toFixed(2)} MAD</p>
                </div>
              )}
            </div>
            <div className="mb-4">
              <label htmlFor="delivery-address" className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse de livraison *
              </label>
              <textarea
                id="delivery-address"
                name="delivery-address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Entrez votre adresse complète..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                required
                autoComplete="street-address"
                aria-label="Adresse de livraison"
              />
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800">
                ⚠️ Un agent de livraison viendra à votre adresse pour collecter le paiement et remettre votre confirmation.
              </p>
            </div>
            <button
              onClick={handleCashDelivery}
              disabled={!deliveryAddress.trim()}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Confirmer - Paiement à la Livraison
            </button>
          </div>
        )}

        {method === 'bank' && (
          <div className="bg-gray-50 p-6 rounded-xl space-y-3">
            <h4 className="font-bold text-gray-900">Bank Transfer Details</h4>
            <p className="text-sm text-gray-600">Please transfer the total amount to:</p>
            <div className="bg-white p-4 rounded border border-gray-200 text-sm font-mono">
              <p>Bank: Overglow Bank</p>
              <p>IBAN: MA64 0000 1111 2222 3333 4444 55</p>
              <p>BIC: OVGLMAMA</p>
            </div>
            <p className="text-xs text-gray-500">Your booking will be confirmed once we receive the transfer.</p>
            <button
              onClick={() => handleSuccess({ type: 'bank_transfer', id: 'pending' })}
              className="w-full bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-gray-900 mt-4"
            >
              I will make the transfer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSelector;
