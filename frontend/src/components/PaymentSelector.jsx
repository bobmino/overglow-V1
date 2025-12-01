import React, { useState } from 'react';
import { CreditCard, Building, Wallet } from 'lucide-react';
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

const PaymentSelector = ({ amount, onPaymentComplete }) => {
  const [method, setMethod] = useState('stripe');
  const [error, setError] = useState('');

  const handleSuccess = (paymentDetails) => {
    onPaymentComplete(paymentDetails);
  };

  const handleError = (msg) => {
    setError(msg);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900">Select Payment Method</h3>
      
      <div className="grid grid-cols-2 gap-4">
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
            method === 'cmi' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <CreditCard size={32} className="mb-2 text-orange-600" />
          <span className="font-semibold">CMI</span>
        </button>

        <button
          onClick={() => setMethod('bank')}
          className={`p-4 border-2 rounded-xl flex flex-col items-center justify-center transition ${
            method === 'bank' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <Building size={32} className="mb-2 text-gray-600" />
          <span className="font-semibold">Bank Transfer</span>
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
          <div className="text-center p-6 bg-gray-50 rounded-xl">
            <p className="mb-4 text-gray-600">You will be redirected to the CMI secure payment gateway.</p>
            <button
              onClick={() => handleSuccess({ type: 'cmi', id: 'mock_cmi_id' })}
              className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700"
            >
              Pay with CMI
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
