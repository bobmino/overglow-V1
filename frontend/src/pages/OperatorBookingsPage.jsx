import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { Calendar, Clock, Users, Mail, ExternalLink, MessageSquare, ArrowRightCircle, CheckCircle, CreditCard } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import EmptyState from '../components/EmptyState';
import InternalNoteModal from '../components/InternalNoteModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { logger } from '../utils/logger.js';

const getDateLocale = (language) => {
  const locale = language?.slice(0, 2) || 'fr';
  if (locale === 'ar') return 'ar-MA';
  if (locale === 'es') return 'es-ES';
  if (locale === 'en') return 'en-GB';
  return 'fr-FR';
};

const OperatorBookingsPage = () => {
  const { t, i18n } = useTranslation();
  const dateLocale = getDateLocale(i18n.language);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [handlingBookingId, setHandlingBookingId] = useState(null);
  const [confirmingPaymentId, setConfirmingPaymentId] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/api/operator/bookings');
      const bookingsArray = Array.isArray(data) ? data : [];
      setBookings(bookingsArray);
      setLoading(false);
    } catch (error) {
      logger.error('Failed to fetch bookings:', error);
      setBookings([]);
      toast(t('operator.bookings.load_error'), { type: 'error' });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleMarkHandled = async (bookingId) => {
    try {
      setHandlingBookingId(bookingId);
      await api.put(`/api/bookings/${bookingId}/handle`);
      fetchBookings();
      toast(t('operator.bookings.marked_handled'), { type: 'success' });
    } catch (error) {
      logger.error('Failed to mark booking as handled:', error);
      toast(t('operator.bookings.action_error'), { type: 'error' });
    } finally {
      setHandlingBookingId(null);
    }
  };

  const handleConfirmPaymentAdmin = async (bookingId) => {
    try {
      setConfirmingPaymentId(bookingId);
      await api.put(`/api/bookings/${bookingId}/status`, { status: 'CONFIRMED' });
      fetchBookings();
      toast(t('operator.bookings.payment_confirmed'), { type: 'success' });
    } catch (error) {
      logger.error('Failed to confirm payment:', error);
      toast(t('operator.bookings.payment_confirm_error'), { type: 'error' });
    } finally {
      setConfirmingPaymentId(null);
    }
  };

  const handleOpenNoteModal = (booking) => {
    setSelectedBooking(booking);
    setShowNoteModal(true);
  };

  const getBookingStatusLabel = (status) => {
    switch (status) {
      case 'Confirmed':
      case 'CONFIRMED':
        return t('operator.bookings.status_confirmed');
      case 'Pending':
      case 'PENDING':
        return t('operator.bookings.status_pending');
      case 'Cancelled':
      case 'CANCELLED':
        return t('operator.bookings.status_cancelled');
      case 'PENDING_PAYMENT':
        return t('operator.bookings.status_pending_payment');
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-primary-100 text-primary-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusLabel = (paymentStatus) => {
    const normalized = (paymentStatus || 'pending').toLowerCase();
    if (normalized === 'paid') return t('operator.bookings.payment_paid');
    if (normalized === 'refunded') return t('operator.bookings.payment_refunded');
    if (normalized === 'failed') return t('operator.bookings.payment_failed');
    return t('operator.bookings.payment_pending');
  };

  const getPaymentStatusColor = (paymentStatus) => {
    const normalized = (paymentStatus || 'pending').toLowerCase();
    if (normalized === 'paid') return 'bg-primary-100 text-primary-800';
    if (normalized === 'refunded') return 'bg-slate-200 text-slate-800';
    if (normalized === 'failed') return 'bg-rose-100 text-rose-800';
    return 'bg-amber-100 text-amber-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('operator.bookings.title')}</h1>
      </div>

      {!Array.isArray(bookings) || bookings.length === 0 ? (
        <EmptyState
          variant="bookings"
          className="bg-gray-50 rounded-xl"
          title={t('operator.bookings.empty_title')}
          subtitle={t('operator.bookings.empty_desc')}
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {booking.schedule?.product?.title}
                  </h3>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Mail size={14} className="me-1" />
                    {booking.user?.email}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(booking.status)}`}>
                    {getBookingStatusLabel(booking.status)}
                  </span>
                  {user?.role?.toLowerCase() === 'admin' && (booking.status === 'Pending' || booking.status === 'PENDING_PAYMENT') && (
                    <button
                      onClick={() => handleConfirmPaymentAdmin(booking._id)}
                      disabled={confirmingPaymentId === booking._id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-600 text-white rounded-full text-xs font-bold hover:bg-primary-700 transition disabled:opacity-50"
                      title={t('operator.bookings.confirm_payment_title')}
                    >
                      <CreditCard size={12} />
                      {confirmingPaymentId === booking._id ? t('operator.common.confirming') : t('operator.bookings.confirm_payment')}
                    </button>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPaymentStatusColor(booking.paymentStatus)}`}>
                    {getPaymentStatusLabel(booking.paymentStatus)}
                  </span>
                  {booking.isHandled && (
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
                      <CheckCircle size={12} />
                      {t('operator.bookings.handled')}
                    </span>
                  )}
                  {booking.internalNote && (
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      {t('operator.bookings.note_badge')}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center text-gray-700">
                  <Calendar size={16} className="me-2 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{t('operator.common.date')}</p>
                    <p className="font-semibold">
                      {new Date(booking.schedule?.date).toLocaleDateString(dateLocale)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-gray-700">
                  <Clock size={16} className="me-2 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{t('operator.common.time')}</p>
                    <p className="font-semibold">{booking.schedule?.time}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-700">
                  <Users size={16} className="me-2 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{t('operator.bookings.tickets')}</p>
                    <p className="font-semibold">{booking.numberOfTickets}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">{t('operator.bookings.revenue')}</p>
                  <p className="text-xl font-bold text-primary-700">€{booking.totalAmount.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">{t('operator.bookings.estimated_payout')}</p>
                  <p className="font-semibold text-gray-900">
                    {booking.payoutDate ? new Date(booking.payoutDate).toLocaleDateString(dateLocale) : t('operator.common.payout_tbd')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                <a
                  href={`mailto:${booking.user?.email}`}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  <Mail size={16} />
                  {t('operator.bookings.contact')}
                </a>
                <button
                  onClick={() => window.open(`/products/${booking.schedule?.product?._id || booking.schedule?.product}`, '_blank')}
                  className="inline-flex items-center gap-2 text-gray-700 hover:text-primary-700 font-semibold"
                >
                  <ExternalLink size={16} />
                  {t('operator.bookings.view_product')}
                </button>
                <button
                  onClick={() => handleOpenNoteModal(booking)}
                  className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold"
                >
                  <MessageSquare size={16} />
                  {booking.internalNote ? t('operator.bookings.edit_note') : t('operator.bookings.internal_note')}
                </button>
                {!booking.isHandled && (
                  <button
                    onClick={() => handleMarkHandled(booking._id)}
                    disabled={handlingBookingId === booking._id}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowRightCircle size={16} />
                    {handlingBookingId === booking._id ? t('operator.common.processing') : t('operator.bookings.mark_handled')}
                  </button>
                )}
                {booking.isHandled && (
                  <span className="inline-flex items-center gap-2 text-gray-500 font-semibold">
                    <CheckCircle size={16} />
                    {t('operator.bookings.already_handled')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNoteModal && selectedBooking && (
        <InternalNoteModal
          booking={selectedBooking}
          isOpen={showNoteModal}
          onClose={() => {
            setShowNoteModal(false);
            setSelectedBooking(null);
          }}
          onSaved={fetchBookings}
        />
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default OperatorBookingsPage;
