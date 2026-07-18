import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Calendar, MapPin, Clock, Users } from 'lucide-react';
import { trackBooking } from '../utils/analytics';
import { useCurrency } from '../context/CurrencyContext';

const BookingSuccessPage = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { formatPrice } = useCurrency();
  const { booking, bookings, isCircuit, paymentReference } = location.state || {};

  const locale = i18n.language?.slice(0, 2) || 'fr';
  const dateLocale =
    locale === 'ar' ? 'ar-MA' : locale === 'es' ? 'es-ES' : locale === 'en' ? 'en-GB' : 'fr-FR';

  // Track booking conversion
  useEffect(() => {
    if (booking) {
      trackBooking({
        id: booking._id,
        _id: booking._id,
        totalAmount: booking.totalAmount || booking.totalPrice,
        totalPrice: booking.totalPrice || booking.totalAmount,
        numberOfTickets: booking.numberOfTickets,
        productId: booking.schedule?.product?._id,
        product: {
          _id: booking.schedule?.product?._id,
          title: booking.schedule?.product?.title,
          category: booking.schedule?.product?.category,
          city: booking.schedule?.product?.city,
        },
        productTitle: booking.schedule?.product?.title,
        category: booking.schedule?.product?.category,
        city: booking.schedule?.product?.city,
      });
    } else if (isCircuit && bookings && bookings.length > 0) {
      // Pour le circuit, on traque chaque réservation ou un event global
      bookings.forEach(b => {
        trackBooking({
          id: b._id,
          _id: b._id,
          totalAmount: b.totalAmount || b.totalPrice,
          totalPrice: b.totalPrice || b.totalAmount,
          numberOfTickets: b.numberOfTickets,
          productId: b.schedule?.product?._id,
        });
      });
    }
  }, [booking, bookings, isCircuit]);

  if (!booking && (!bookings || bookings.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t('booking_success.no_booking')}</p>
          <Link to="/" className="text-primary-700 font-semibold hover:underline">
            {t('booking_success.back_home')}
          </Link>
        </div>
      </div>
    );
  }

  const itemsToDisplay = isCircuit ? bookings : [booking];
  
  const totalAmountGlobal = itemsToDisplay.reduce((acc, curr) => {
    const amount = typeof curr.totalPrice === 'number' ? curr.totalPrice : (typeof curr.totalAmount === 'number' ? curr.totalAmount : ((curr.schedule?.price || 0) * (curr.numberOfTickets || 0)));
    return acc + amount;
  }, 0);

  const referenceGlobal = paymentReference || booking?._id?.slice(-8).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-4">
              <CheckCircle size={48} className="text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isCircuit ? t('booking_success.title_circuit') : t('booking_success.title')}
            </h1>
            <p className="text-gray-600">{t('booking_success.confirmed')}</p>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6">{t('booking_success.details')}</h2>
            
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('booking_success.payment_ref')}</p>
                <p className="font-bold text-lg text-primary-700">{referenceGlobal}</p>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-bold text-gray-900 mb-4">
                  {isCircuit ? t('booking_success.your_itinerary') : t('booking_success.your_experience')}
                </h3>
                
                <div className="space-y-6">
                  {itemsToDisplay.map((item, idx) => (
                    <div key={item._id || idx} className={`space-y-2 text-gray-700 ${idx !== 0 ? 'pt-4 border-t border-gray-50' : ''}`}>
                      <p className="font-semibold text-gray-900">{item.schedule?.product?.title || t('booking_success.experience_fallback')}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center">
                          <MapPin size={14} className="me-2 text-primary-500" />
                          {item.schedule?.product?.city}
                        </div>
                        <div className="flex items-center">
                          <Calendar size={14} className="me-2 text-primary-500" />
                          {new Date(item.schedule?.date).toLocaleDateString(dateLocale)}
                        </div>
                        <div className="flex items-center">
                          <Clock size={14} className="me-2 text-primary-500" />
                          {item.schedule?.time}
                        </div>
                        <div className="flex items-center">
                          <Users size={14} className="me-2 text-primary-500" />
                          {t('booking_success.tickets', { count: item.numberOfTickets })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('booking_success.total')}</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatPrice(totalAmountGlobal, 'MAD')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-6 mb-6">
            <h3 className="font-bold text-blue-900 mb-3">{t('booking_success.next_title')}</h3>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>• {t('booking_success.next_1')}</li>
              <li>• {t('booking_success.next_2')}</li>
              <li>• {t('booking_success.next_3')}</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/dashboard" 
              className="flex-1 bg-primary-600 text-white text-center py-3 rounded-xl font-bold hover:bg-primary-700 transition"
            >
              {t('booking_success.view_bookings')}
            </Link>
            <Link 
              to="/" 
              className="flex-1 bg-white border-2 border-gray-200 text-gray-700 text-center py-3 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition"
            >
              {t('booking_success.back_home_cta')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;
