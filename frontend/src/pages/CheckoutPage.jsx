import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { Calendar, Clock, Users, MapPin, CreditCard, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import PaymentSelector from '../components/PaymentSelector';
import { trackBeginCheckout } from '../utils/analytics';
import { formatImageUrlWithFallback } from '../utils/formatImage';
import { logger } from '../utils/logger.js';

const dateLocaleMap = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', ar: 'ar-MA' };

const buildBookingPayload = (item, paymentMethod = 'stripe') => {
  const payload = {
    scheduleId: item.schedule._id,
    numberOfTickets: item.numberOfTickets,
    paymentMethod,
    skipTheLineEnabled: item.product?.skipTheLine?.enabled || false,
    skipTheLinePrice:
      item.skipTheLine && item.product?.skipTheLine?.enabled
        ? Number(item.product.skipTheLine.additionalPrice) * item.numberOfTickets
        : 0,
    deferPayment: true,
  };

  if (String(item.schedule._id).startsWith('virtual_')) {
    payload.virtualScheduleData = {
      productId: item.product._id,
      date: item.schedule.date,
      time: item.schedule.time,
      endTime: item.schedule.endTime || '',
      price: item.product.price || 0,
      capacity: 100,
      currency: 'MAD',
    };
  }

  return payload;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const { cartItems, clearCart } = useCart();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preparing, setPreparing] = useState(true);
  const [error, setError] = useState('');
  const [pendingBookings, setPendingBookings] = useState([]);
  const [prepareAttempt, setPrepareAttempt] = useState(0);
  const preparedRef = useRef(false);
  /** Empêche navigate('/') quand clearCart vide le panier juste avant booking-success */
  const completingRef = useRef(false);

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

  const bookingIds = useMemo(
    () => pendingBookings.map((b) => b._id).filter(Boolean),
    [pendingBookings]
  );
  const primaryBookingId = bookingIds[0] || null;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (checkoutItems.length === 0) {
      if (!completingRef.current) {
        navigate('/');
      }
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

  // Create PENDING_PAYMENT bookings before PSP (Stripe requires bookingId)
  useEffect(() => {
    if (!isAuthenticated || checkoutItems.length === 0 || preparedRef.current) return;

    let cancelled = false;
    const prepare = async () => {
      setPreparing(true);
      setError('');
      try {
        for (const item of checkoutItems) {
          if (!item.schedule?._id) {
            throw new Error(t('checkout.err_invalid_slot'));
          }
        }

        const created = [];
        for (const item of checkoutItems) {
          const { data } = await api.post('/api/bookings', buildBookingPayload(item, 'stripe'));
          created.push(data);
        }
        if (!cancelled) {
          preparedRef.current = true;
          setPendingBookings(created);
        }
      } catch (err) {
        logger.error('Checkout prepare bookings failed', err);
        if (!cancelled) {
          const msg =
            err.response?.data?.message || err.message || t('checkout.err_booking_failed');
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setPreparing(false);
      }
    };

    prepare();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, checkoutItems, t, prepareAttempt, toast]);

  const handlePaymentComplete = async (paymentDetails) => {
    setLoading(true);
    setError('');
    completingRef.current = true;

    try {
      // Bookings already exist (deferred). Offline methods may have updated them via API.
      if (pendingBookings.length > 0) {
        const successState =
          pendingBookings.length > 1
            ? { bookings: pendingBookings, isCircuit: true, paymentDetails }
            : { booking: pendingBookings[0], paymentDetails };
        navigate('/booking-success', { state: successState });
        clearCart();
        return;
      }

      // Legacy fallback: create bookings after payment
      const createdBookings = [];
      for (const item of checkoutItems) {
        if (!item.schedule._id) {
          throw new Error(t('checkout.err_invalid_slot'));
        }

        const payload = {
          ...buildBookingPayload(item, paymentDetails.type),
          deferPayment: false,
          paymentId: paymentDetails.id,
          ...(paymentDetails.deliveryAddress && { deliveryAddress: paymentDetails.deliveryAddress }),
        };
        delete payload.deferPayment;

        const { data } = await api.post('/api/bookings', {
          ...payload,
          paymentMethod: paymentDetails.type,
          paymentId: paymentDetails.id,
        });
        createdBookings.push(data);
      }

      navigate('/booking-success', {
        state:
          createdBookings.length > 1
            ? { bookings: createdBookings, isCircuit: true }
            : { booking: createdBookings[0] },
      });
      clearCart();
    } catch (err) {
      completingRef.current = false;
      logger.error('Checkout payment complete failed', err);
      const msg =
        err.response?.data?.message || err.message || t('checkout.err_booking_failed');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const multi = checkoutItems.length > 1;

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-heading font-bold text-slate-900 mb-8">
          {t('checkout.title')}
        </h1>

        {error && (
          <div
            className="sticky top-20 z-40 mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 shadow-sm"
            role="alert"
            aria-live="assertive"
          >
            <p className="font-semibold">{error}</p>
            <p className="text-sm text-red-600 mt-1">
              {t(
                'checkout.err_retry_hint',
                'Réessayez ou revenez à l’expérience pour resélectionner une date.'
              )}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-none">
            <section
              className="bg-white rounded-xl border border-gray-200 p-6"
              aria-labelledby="booking-details-heading"
            >
              <h2 id="booking-details-heading" className="text-xl font-bold mb-4">
                {t('checkout.details')}
              </h2>

              <div className="space-y-4">
                {checkoutItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                  >
                    <img
                      src={formatImageUrlWithFallback(item.product?.images?.[0])}
                      alt={item.product?.title || ''}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {item.product?.title}
                      </h3>
                      <div className="mt-2 space-y-1 text-sm text-slate-600">
                        {item.product?.city && (
                          <p className="flex items-center gap-2">
                            <MapPin size={14} /> {item.product.city}
                          </p>
                        )}
                        {item.schedule?.date && (
                          <p className="flex items-center gap-2">
                            <Calendar size={14} />
                            {new Date(item.schedule.date).toLocaleDateString(dateLocale)}
                          </p>
                        )}
                        {item.schedule?.time && (
                          <p className="flex items-center gap-2">
                            <Clock size={14} /> {item.schedule.time}
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <Users size={14} />
                          {t('checkout.tickets', { count: item.numberOfTickets })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <CreditCard size={24} className="me-2" aria-hidden="true" />
                {t('checkout.payment_info')}
              </h2>

              {error && (
                <div
                  className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 lg:block hidden"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {preparing ? (
                <div className="py-10 text-center text-slate-500" aria-busy="true">
                  {t('common.loading')}
                </div>
              ) : primaryBookingId ? (
                <PaymentSelector
                  amount={totalPrice}
                  currency="MAD"
                  bookingId={primaryBookingId}
                  bookingIds={bookingIds}
                  onPaymentComplete={handlePaymentComplete}
                  disabled={loading}
                />
              ) : (
                <div className="space-y-3">
                  <p className="text-slate-600">{t('checkout.err_booking_failed')}</p>
                  <button
                    type="button"
                    className="text-sm font-semibold text-primary-700 underline"
                    onClick={() => {
                      preparedRef.current = false;
                      setPendingBookings([]);
                      setError('');
                      setPrepareAttempt((n) => n + 1);
                    }}
                  >
                    {t('common.retry', 'Réessayer')}
                  </button>
                </div>
              )}
            </section>
          </div>

          <aside className="lg:col-span-1 order-1 lg:order-none" aria-labelledby="price-summary-heading">
            <div className="bg-white rounded-xl border border-gray-200 p-6 lg:sticky lg:top-24">
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
                  <span className="text-2xl font-bold text-primary-700">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>

              <p
                className="text-xs text-gray-500 mt-4 flex items-center gap-1"
                aria-live="polite"
              >
                <Lock size={12} className="text-primary-600" />
                {t('checkout.secure_payment')}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
