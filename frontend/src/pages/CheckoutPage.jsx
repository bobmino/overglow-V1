import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../config/axios';
import { Calendar, Clock, Users, MapPin, CreditCard, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import PaymentSelector from '../components/PaymentSelector';
import { trackBeginCheckout } from '../utils/analytics';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { formatPrice, convert } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { product, schedule, numberOfTickets, skipTheLine } = location.state || {};

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
    }
    if (!product || !schedule) {
      navigate('/');
    }
  }, [isAuthenticated, product, schedule, navigate, location]);

  // Calculate total price with skip-the-line and multi-currency
  const priceBreakdown = useMemo(() => {
    if (!schedule || !numberOfTickets) return null;
    
    const basePrice = Number(schedule.price) || 0;
    const baseTotal = basePrice * numberOfTickets;
    
    // Skip-the-line price (if enabled)
    const skipTheLinePrice = (product?.skipTheLine?.enabled && product?.skipTheLine?.additionalPrice) 
      ? Number(product.skipTheLine.additionalPrice) * numberOfTickets 
      : 0;
    
    const subtotal = baseTotal + skipTheLinePrice;
    
    return {
      basePrice,
      baseTotal,
      skipTheLinePrice,
      subtotal,
      numberOfTickets,
    };
  }, [schedule, numberOfTickets, product]);

  const totalPrice = priceBreakdown?.subtotal || 0;

  const [bookingId, setBookingId] = useState(null);

  const handlePaymentComplete = async (paymentDetails) => {
    setLoading(true);
    setError('');

    try {
      // If booking was already created (for cash payments), update it
      if (bookingId) {
        const { data } = await api.put(`/api/bookings/${bookingId}`, {
          paymentMethod: paymentDetails.type,
          paymentId: paymentDetails.id,
          ...(paymentDetails.deliveryAddress && { deliveryAddress: paymentDetails.deliveryAddress })
        });
        navigate('/booking-success', { state: { booking: data } });
      } else {
        // Create booking first (include skip-the-line in total)
        const { data } = await api.post('/api/bookings', {
          scheduleId: schedule._id,
          numberOfTickets: numberOfTickets,
          paymentMethod: paymentDetails.type,
          paymentId: paymentDetails.id,
          skipTheLineEnabled: product?.skipTheLine?.enabled || false,
          skipTheLinePrice: priceBreakdown?.skipTheLinePrice || 0,
          ...(paymentDetails.deliveryAddress && { deliveryAddress: paymentDetails.deliveryAddress })
        });
        navigate('/booking-success', { state: { booking: data } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
      setLoading(false);
    }
  };

  if (!product || !schedule) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 id="checkout-title" className="text-3xl font-bold text-gray-900 mb-8">Complete your booking</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking Summary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Info */}
              <section className="bg-white rounded-xl border border-gray-200 p-6" aria-labelledby="booking-details-heading">
                <h2 id="booking-details-heading" className="text-xl font-bold mb-4">Booking Details</h2>
                <div className="flex gap-4">
                  <img 
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=200'} 
                    alt={product.title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">{product.title}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin size={14} className="mr-2" />
                        {product.city}
                      </div>
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2" />
                        {new Date(schedule.date).toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="flex items-center">
                        <Clock size={14} className="mr-2" />
                        {schedule.time}
                      </div>
                      <div className="flex items-center">
                        <Users size={14} className="mr-2" />
                        {numberOfTickets} ticket{numberOfTickets > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment Selection */}
              <section className="bg-white rounded-xl border border-gray-200 p-6" aria-labelledby="payment-heading">
                <h2 id="payment-heading" className="text-xl font-bold mb-4 flex items-center">
                  <CreditCard size={24} className="mr-2" aria-hidden="true" />
                  Payment Information
                </h2>
                
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700" role="alert" aria-live="assertive">
                    {error}
                  </div>
                )}

                <PaymentSelector 
                  amount={totalPrice} 
                  onPaymentComplete={handlePaymentComplete}
                  bookingId={bookingId}
                />
              </section>
            </div>

            {/* Price Summary */}
            <aside className="lg:col-span-1" aria-labelledby="price-summary-heading">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
                <h2 id="price-summary-heading" className="text-xl font-bold mb-4">Price Summary</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-700">
                    <span>{formatPrice(priceBreakdown?.basePrice || 0, 'EUR')} × {numberOfTickets} ticket{numberOfTickets > 1 ? 's' : ''}</span>
                    <span>{formatPrice(priceBreakdown?.baseTotal || 0, 'EUR')}</span>
                  </div>
                  {priceBreakdown?.skipTheLinePrice > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span className="flex items-center gap-1">
                        <span>⚡</span>
                        Skip-the-Line ({product?.skipTheLine?.type || 'Fast Track'})
                      </span>
                      <span>{formatPrice(priceBreakdown.skipTheLinePrice, 'EUR')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-700">
                    <span>Service fee</span>
                    <span>{formatPrice(0, 'EUR')}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-green-700">{formatPrice(totalPrice, 'EUR')}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-4" aria-live="polite">
                  Free cancellation up to 24 hours before the experience starts
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
