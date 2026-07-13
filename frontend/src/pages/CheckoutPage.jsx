import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { Calendar, Clock, Users, MapPin, CreditCard, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import PaymentSelector from '../components/PaymentSelector';
import { trackBeginCheckout } from '../utils/analytics';
import { formatImageUrlWithFallback } from '../utils/formatImage';
import { logger } from '../utils/logger.js';

const dateLocaleMap = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', ar: 'ar-MA' };

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const { cartItems, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { product, schedule, numberOfTickets, skipTheLine } = location.state || {};
  const lang = (i18n.language || 'fr').slice(0, 2);
  const dateLocale = dateLocaleMap[lang] || 'fr-FR';

  const checkoutItems = useMemo(() => {
    if (product && schedule) {
      return [{
        product,
        schedule,
        numberOfTickets,
        skipTheLine: skipTheLine || false,
        priceBreakdown: {
          subtotal: (Number(schedule.price || product.price || 0) * numberOfTickets) +
            (skipTheLine && product?.skipTheLine?.enabled
              ? Number(product.skipTheLine.additionalPrice) * numberOfTickets
              : 0),
        },
      }];
    }
    if (cartItems && cartItems.length > 0) {
      return cartItems;
    }
    return [];
  }, [cartItems, product, schedule, numberOfTickets, skipTheLine]);

  const totalPrice = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + (item.priceBreakdown?.subtotal || 0), 0),
    [checkoutItems]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (checkoutItems.length === 0) {
      navigate('/');
      return;
    }

    trackBeginCheckout({
      totalAmount: totalPrice,
      totalPrice,
      items: checkoutItems.map((item) => ({
        item_id: item.product._id,
        item_name: item.product.title,
        item_category: item.product.category,
        price: item.schedule?.price || item.product.price || 0,
        quantity: item.numberOfTickets || 1,
      })),
    });
  }, [isAuthenticated, checkoutItems, navigate, location, totalPrice]);

  const [bookingId, setBookingId] = useState(null);

  const handlePaymentComplete = async (paymentDetails) => {
    setLoading(true);
    setError('');

    try {
      const createdBookings = [];

      for (const item of checkoutItems) {
        if (!item.schedule._id) {
          throw new Error(t('checkout.err_invalid_slot'));
        }

        const payload = {
          scheduleId: item.schedule._id,
          numberOfTickets: item.numberOfTickets,
          paymentMethod: paymentDetails.type,
          paymentId: paymentDetails.id,
          skipTheLineEnabled: item.product?.skipTheLine?.enabled || false,
          skipTheLinePrice:
            item.skipTheLine && item.product?.skipTheLine?.enabled
              ? Number(item.product.skipTheLine.additionalPrice) * item.numberOfTickets
              : 0,
          ...(paymentDetails.deliveryAddress && { deliveryAddress: paymentDetails.deliveryAddress }),
        };

        if (String(item.schedule._id).startsWith('virtual_')) {
          payload.virtualScheduleData = {
            productId: item.product._id,
            date: item.schedule.date,
            time: item.schedule.time,
            endTime: item.schedule.endTime || '',
            price: item.product.price || 0,
            capacity: 100,
            currency: 'EUR',
          };
        }

        const { data } = await api.post('/api/bookings', payload);
        createdBookings.push(data);
      }

      if (!product || !schedule) {
        clearCart();
      }

      if (createdBookings.length > 1) {
        navigate('/booking-success', { state: { bookings: createdBookings, isCircuit: true } });
      } else {
        navigate('/booking-success', { state: { booking: createdBookings[0] } });
      }
    } catch (err) {
      logger.error('❌ Booking creation failed:', err.response?.data || err.message);
      if (err.response?.data?.errors) {
        setError(JSON.stringify(err.response.data.errors));
      } else {
        setError(
          err.response?.data?.message || err.message || t('checkout.err_booking_failed')
        );
      }
      setLoading(false);
    }
  };

  if (checkoutItems.length === 0) {
    return null;
  }

  const multi = checkoutItems.length > 1;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 id="checkout-title" className="text-3xl font-bold text-gray-900 mb-8">
            {multi ? t('checkout.title_order') : t('checkout.title')}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <section
                className="bg-white rounded-xl border border-gray-200 p-6"
                aria-labelledby="booking-details-heading"
              >
                <h2 id="booking-details-heading" className="text-xl font-bold mb-4">
                  {multi ? t('checkout.details_order') : t('checkout.details')}
                </h2>

                <div className="space-y-6">
                  {checkoutItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-4 ${idx !== 0 ? 'pt-6 border-t border-gray-100' : ''}`}
                    >
                      <img
                        src={formatImageUrlWithFallback(item.product?.images?.[0])}
                        alt={item.product?.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-2">{item.product?.title}</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin size={14} className="me-2 text-emerald-600" />
                            {item.product?.city}
                          </div>
                          {item.schedule?.date && (
                            <div className="flex items-center">
                              <Calendar size={14} className="me-2 text-emerald-600" />
                              <span className="capitalize">
                                {new Date(item.schedule.date).toLocaleDateString(dateLocale, {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          )}
                          {item.schedule?.time && (
                            <div className="flex items-center">
                              <Clock size={14} className="me-2 text-emerald-600" />
                              {item.schedule.time}
                            </div>
                          )}
                          <div className="flex items-center mt-2">
                            <span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-medium text-gray-800">
                              {t('checkout.tickets', { count: item.numberOfTickets })}
                            </span>
                            {item.skipTheLine && (
                              <span className="ms-2 flex items-center gap-1 text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-md">
                                <CheckCircle size={12} /> {t('checkout.skip_line')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-end">
                        <span className="font-bold text-gray-900">
                          {formatPrice(item.priceBreakdown?.subtotal || 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section
                className="bg-white rounded-xl border border-gray-200 p-6"
                aria-labelledby="payment-heading"
              >
                <h2 id="payment-heading" className="text-xl font-bold mb-4 flex items-center">
                  <CreditCard size={24} className="me-2" aria-hidden="true" />
                  {t('checkout.payment_info')}
                </h2>

                {error && (
                  <div
                    className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"
                    role="alert"
                    aria-live="assertive"
                  >
                    {error}
                  </div>
                )}

                <PaymentSelector
                  amount={totalPrice}
                  onPaymentComplete={handlePaymentComplete}
                  bookingId={bookingId}
                  disabled={loading}
                />
              </section>
            </div>

            <aside className="lg:col-span-1" aria-labelledby="price-summary-heading">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
                <h2 id="price-summary-heading" className="text-xl font-bold mb-4">
                  {t('checkout.price_summary')}
                </h2>

                {multi ? (
                  <div className="space-y-3 mb-6">
                    {checkoutItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                      >
                        <span className="text-gray-800 font-medium mb-1 truncate">
                          {item.product?.title}
                        </span>
                        <div className="flex justify-between text-gray-600">
                          <span>
                            {t('checkout.tickets_line', { count: item.numberOfTickets })}
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatPrice(item.priceBreakdown?.subtotal || 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span>
                        {t('checkout.tickets', { count: checkoutItems[0]?.numberOfTickets || 0 })}
                      </span>
                      <span>
                        {formatPrice(checkoutItems[0]?.priceBreakdown?.subtotal || 0)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">{t('checkout.total')}</span>
                    <span className="text-2xl font-bold text-green-700">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>

                <p
                  className="text-xs text-gray-500 mt-4 flex items-center gap-1"
                  aria-live="polite"
                >
                  <Lock size={12} className="text-emerald-600" />
                  {t('checkout.secure_payment')}
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
