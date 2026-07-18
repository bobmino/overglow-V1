import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, ChevronRight, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { trackBookingPageView } from '../utils/analytics';
import { formatImageUrlWithFallback } from '../utils/formatImage';
import { logger } from '../utils/logger.js';

const getDateLocale = (language) => {
  const locale = language?.slice(0, 2) || 'fr';
  if (locale === 'ar') return 'ar-MA';
  if (locale === 'es') return 'es-ES';
  if (locale === 'en') return 'en-GB';
  return 'fr-FR';
};

const BookingPage = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const { product, date, timeSlot, tickets } = location.state || {};

  const dateLocale = getDateLocale(i18n.language);
  
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [travelerDetails, setTravelerDetails] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  // Keep traveler details synchronized if user loads after mount
  useEffect(() => {
    if (user) {
      setTravelerDetails(prev => ({
        firstName: prev.firstName || user.name?.split(' ')[0] || '',
        lastName: prev.lastName || user.name?.split(' ').slice(1).join(' ') || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || ''
      }));
    }
  }, [user]);

  // Calculate total price with skip-the-line
  const totalPrice = useMemo(() => {
    if (!selectedSlot || !tickets) return 0;
    const basePrice = Number(selectedSlot.price) || 0;
    const baseTotal = basePrice * tickets;
    const skipTheLinePrice = (product?.skipTheLine?.enabled && product?.skipTheLine?.additionalPrice) 
      ? Number(product.skipTheLine.additionalPrice) * tickets 
      : 0;
    return baseTotal + skipTheLinePrice;
  }, [selectedSlot, tickets, product]);

  useEffect(() => {
    if (!product || !date || !timeSlot) {
      navigate('/');
      return;
    }

    const fetchSchedules = async () => {
      try {
        // Create or find schedule for the selected date and time slot
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);

        // Filter existing schedules or create a virtual one
        const relevantSchedules = product.schedules?.filter(s => {
          const scheduleDate = new Date(s.date);
          scheduleDate.setHours(0, 0, 0, 0);
          return scheduleDate.getTime() === selectedDate.getTime() && 
                 s.time === timeSlot.startTime;
        }) || [];

        // If no schedule exists, create a virtual one for display
        if (relevantSchedules.length === 0) {
          const virtualSchedule = {
            _id: 'virtual_' + Date.now(),
            date: selectedDate,
            time: timeSlot.startTime,
            endTime: timeSlot.endTime,
            price: product.price || 0,
            capacity: 100,
            bookings: []
          };
          setAvailableSlots([virtualSchedule]);
          setSelectedSlot(virtualSchedule);
        } else {
          setAvailableSlots(relevantSchedules);
          const matchingSlot = relevantSchedules.find(s => s.time === timeSlot.startTime) || relevantSchedules[0];
          setSelectedSlot(matchingSlot);
        }
        setLoading(false);
      } catch (error) {
        logger.error('Error fetching schedules:', error);
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [product, date, timeSlot, navigate]);

  // Track booking page view
  useEffect(() => {
    if (product && selectedSlot) {
      trackBookingPageView({
        productId: product._id,
        product: product,
        productTitle: product.title,
        category: product.category,
        totalAmount: totalPrice,
        totalPrice: totalPrice,
        numberOfTickets: tickets || 1,
      });
    }
  }, [product, selectedSlot, totalPrice, tickets]);

  const handleContinue = async () => {
    if (!selectedSlot) return;
    
    navigate('/checkout', {
      state: {
        product,
        schedule: selectedSlot,
        numberOfTickets: tickets,
        travelerDetails,
        date,
        timeSlot,
        skipTheLine: product?.skipTheLine || null
      }
    });
  };

  if (!product) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12 pt-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8 text-sm font-medium">
            <div className="flex items-center text-primary-600">
              <span className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center me-2">1</span>
              {t('booking_page.step_details')}
            </div>
            <div className="w-12 h-0.5 bg-slate-200 mx-4"></div>
            <div className="flex items-center text-slate-400">
              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center me-2">2</span>
              {t('booking_page.step_payment')}
            </div>
            <div className="w-12 h-0.5 bg-slate-200 mx-4"></div>
            <div className="flex items-center text-slate-400">
              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center me-2">3</span>
              {t('booking_page.step_confirmation')}
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-8">{t('booking_page.page_title')}</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {/* Time Selection */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Clock className="me-2 text-primary-600" size={20} />
                  {t('booking_page.select_time')}
                </h2>
                
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-lg"></div>)}
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {availableSlots.map(slot => (
                      <button
                        key={slot._id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-4 rounded-xl border-2 text-start transition ${
                          selectedSlot?._id === slot._id
                            ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-600 ring-offset-2'
                            : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-lg mb-1">{slot.time}</div>
                        <div className="text-sm text-slate-600">
                          {new Date(slot.date).toLocaleDateString(dateLocale, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-sm font-medium text-primary-700 mt-2">
                          {formatPrice(slot.price, 'MAD')}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-orange-50 text-orange-700 rounded-lg flex items-start">
                    <AlertCircle className="me-2 mt-0.5 flex-shrink-0" size={18} />
                    <p>{t('booking_page.no_slots')}</p>
                  </div>
                )}
              </div>

              {/* Traveler Details */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Users className="me-2 text-primary-600" size={20} />
                  {t('booking_page.traveler_details')}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="traveler-first-name" className="block text-sm font-medium text-slate-700 mb-1">{t('booking_page.first_name')}</label>
                    <input
                      type="text"
                      id="traveler-first-name"
                      name="traveler-first-name"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={travelerDetails.firstName}
                      onChange={e => setTravelerDetails({...travelerDetails, firstName: e.target.value})}
                      autoComplete="given-name"
                    />
                  </div>
                  <div>
                    <label htmlFor="traveler-last-name" className="block text-sm font-medium text-slate-700 mb-1">{t('booking_page.last_name')}</label>
                    <input
                      type="text"
                      id="traveler-last-name"
                      name="traveler-last-name"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={travelerDetails.lastName}
                      onChange={e => setTravelerDetails({...travelerDetails, lastName: e.target.value})}
                      autoComplete="family-name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="traveler-email" className="block text-sm font-medium text-slate-700 mb-1">{t('booking_page.email')}</label>
                    <input
                      type="email"
                      id="traveler-email"
                      name="traveler-email"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={travelerDetails.email}
                      onChange={e => setTravelerDetails({...travelerDetails, email: e.target.value})}
                      autoComplete="email"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="traveler-phone" className="block text-sm font-medium text-slate-700 mb-1">{t('booking_page.phone')}</label>
                    <input
                      type="tel"
                      id="traveler-phone"
                      name="traveler-phone"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={travelerDetails.phone}
                      onChange={e => setTravelerDetails({...travelerDetails, phone: e.target.value})}
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 sticky top-24">
                <h3 className="font-bold text-lg mb-4">{t('booking_page.order_summary')}</h3>
                
                <div className="flex gap-3 mb-4 pb-4 border-b border-slate-100">
                  <img 
                    src={formatImageUrlWithFallback(product.images?.[0])} 
                    alt={product.title} 
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-sm line-clamp-2">{product.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{product.city}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('booking_page.date')}</span>
                    <span className="font-medium">
                      {date && new Date(date).toLocaleDateString(dateLocale)}
                    </span>
                  </div>
                  {timeSlot && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">{t('booking_page.time_slot')}</span>
                      <span className="font-medium">{timeSlot.startTime} - {timeSlot.endTime}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('booking_page.tickets_label')}</span>
                    <span className="font-medium">{tickets}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mb-6">
                  {selectedSlot && (
                    <>
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>{formatPrice(selectedSlot.price, 'MAD')} × {t('booking_page.tickets_line', { count: tickets })}</span>
                          <span>{formatPrice(selectedSlot.price * tickets, 'MAD')}</span>
                        </div>
                        {product?.skipTheLine?.enabled && product?.skipTheLine?.additionalPrice > 0 && (
                          <div className="flex justify-between text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <span>⚡</span>
                              {t('booking_page.skip_the_line', { type: product.skipTheLine.type })}
                            </span>
                            <span>{formatPrice(product.skipTheLine.additionalPrice * tickets, 'MAD')}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="font-bold text-slate-900">{t('booking_page.total')}</span>
                        <span className="font-bold text-xl text-primary-700">
                          {formatPrice(totalPrice, 'MAD')}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <button
                  data-testid="continue-to-checkout"
                  onClick={handleContinue}
                  disabled={!selectedSlot || !travelerDetails.firstName || !travelerDetails.email}
                  className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {t('booking_page.continue_payment')}
                  <ChevronRight size={18} className="ms-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
