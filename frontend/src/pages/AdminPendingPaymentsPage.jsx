import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { useToast } from '../context/ToastContext';
import { logger } from '../utils/logger.js';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Building2,
  Calendar,
  User,
  Package,
  DollarSign,
  X,
} from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import EmptyState from '../components/EmptyState';

const getDateLocale = (language) => {
  const locale = language?.slice(0, 2) || 'fr';
  if (locale === 'ar') return 'ar-MA';
  if (locale === 'es') return 'es-ES';
  if (locale === 'en') return 'en-GB';
  return 'fr-FR';
};

const RejectModal = ({ isOpen, onClose, onConfirm, bookingId, clientName }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast(t('admin.pending_payments.rejection_reason_required'), { type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await api.put(`/api/admin/bookings/${bookingId}/reject-payment`, {
        rejectionReason: reason.trim(),
      });
      toast(t('admin.pending_payments.reject_success'), { type: 'success' });
      onConfirm();
      onClose();
      setReason('');
    } catch (error) {
      logger.error('Reject payment error:', error);
      toast(error.response?.data?.message || t('admin.pending_payments.reject_error'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <XCircle size={24} className="text-white" />
            <h2 className="text-xl font-bold text-white">{t('admin.pending_payments.reject_modal_title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-gray-600 text-sm">
            {t('admin.pending_payments.client_label')} <span className="font-semibold text-gray-900">{clientName}</span>
          </p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('admin.pending_payments.rejection_reason')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin.pending_payments.rejection_reason_placeholder')}
              rows={4}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              {t('admin.common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('admin.pending_payments.sending') : t('admin.pending_payments.confirm_rejection')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPendingPaymentsPage = () => {
  const { t, i18n } = useTranslation();
  const dateLocale = getDateLocale(i18n.language);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState({ isOpen: false, bookingId: null, clientName: '' });
  const { toast } = useToast();

  const formatDate = (rawDate) => {
    if (!rawDate) return '—';
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(dateLocale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) return '—';
    return time;
  };

  const formatAmount = (value) => {
    const amount = Number(value || 0);
    return `${amount.toLocaleString(dateLocale)} MAD`;
  };

  const getPaymentMethodLabel = (method) => {
    return t(`admin.pending_payments.payment_methods.${method}`, { defaultValue: method || '—' });
  };

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/admin/bookings/pending-payments');
      setBookings(data);
    } catch (error) {
      logger.error('Failed to fetch pending payments:', error);
      toast(t('admin.pending_payments.load_error'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const handleConfirmPayment = async (bookingId) => {
    try {
      await api.put(`/api/admin/bookings/${bookingId}/confirm-payment`);
      toast(t('admin.pending_payments.confirm_success'), { type: 'success' });
      fetchPendingPayments();
    } catch (error) {
      logger.error('Confirm payment error:', error);
      toast(error.response?.data?.message || t('admin.pending_payments.confirm_error'), { type: 'error' });
    }
  };

  const handleOpenRejectModal = (bookingId, clientName) => {
    setRejectModal({ isOpen: true, bookingId, clientName });
  };

  const handleCloseRejectModal = () => {
    setRejectModal({ isOpen: false, bookingId: null, clientName: '' });
  };

  const handleRejectConfirm = () => {
    fetchPendingPayments();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="container mx-auto px-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/dashboard"
              className="p-2 rounded-xl surface-card hover:border-primary-400 transition"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </Link>
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900">{t('admin.pending_payments.title')}</h1>
              <p className="text-muted text-sm mt-1">
                {t('admin.pending_payments.subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="surface-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-100">
                <Clock size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">{t('admin.pending_payments.pending_count')}</p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary-100">
                <DollarSign size={24} className="text-primary-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">{t('admin.pending_payments.total_amount')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0))}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <CreditCard size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">{t('admin.pending_payments.methods_label')}</p>
                <p className="text-sm text-gray-700 font-medium">{t('admin.pending_payments.methods_value')}</p>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-emerald-600" />
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm">
            <EmptyState
              variant="bookings"
              title={t('admin.pending_payments.empty_title')}
              subtitle={t('admin.pending_payments.empty_desc')}
            />
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="text-start px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t('admin.common.reference')}
                    </th>
                    <th className="text-start px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t('admin.common.client')}
                    </th>
                    <th className="text-start px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t('admin.common.product')}
                    </th>
                    <th className="text-start px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t('admin.common.date')}
                    </th>
                    <th className="text-end px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t('admin.common.amount')}
                    </th>
                    <th className="text-start px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t('admin.common.method')}
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t('admin.common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((booking) => (
                    <tr
                      key={booking._id}
                      className="hover:bg-primary-50/30 transition"
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-mono font-bold text-amber-700">
                          <Clock size={12} />
                          {booking.paymentReference || `OG-${booking._id.slice(-8).toUpperCase()}`}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-100">
                            <User size={16} className="text-gray-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {booking.user?.name || '—'}
                            </p>
                            <p className="text-gray-500 text-xs">{booking.user?.email || '—'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary-100">
                            <Package size={16} className="text-primary-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {booking.schedule?.product?.title || '—'}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {booking.schedule?.product?.city || ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-900 font-medium">
                              {formatDate(booking.schedule?.date)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTime(booking.schedule?.time)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-end">
                        <p className="text-lg font-bold text-gray-900">
                          {formatAmount(booking.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t('admin.pending_payments.tickets', { count: booking.numberOfTickets })}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          booking.paymentMethod === 'bank_transfer'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {booking.paymentMethod === 'bank_transfer' ? (
                            <Building2 size={12} />
                          ) : (
                            <CreditCard size={12} />
                          )}
                          {getPaymentMethodLabel(booking.paymentMethod)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleConfirmPayment(booking._id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition shadow-sm hover:shadow-md"
                          >
                            <CheckCircle size={14} />
                            {t('admin.pending_payments.confirm_payment')}
                          </button>
                          <button
                            onClick={() => handleOpenRejectModal(booking._id, booking.user?.name || t('admin.common.client'))}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition shadow-sm hover:shadow-md"
                          >
                            <XCircle size={14} />
                            {t('admin.common.reject')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden divide-y divide-gray-100">
              {bookings.map((booking) => (
                <div key={booking._id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-mono font-bold text-amber-700">
                      {booking.paymentReference || `OG-${booking._id.slice(-8).toUpperCase()}`}
                    </span>
                    <p className="text-lg font-bold text-gray-900">
                      {formatAmount(booking.totalAmount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-700 font-medium">
                      {booking.user?.name || '—'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {booking.schedule?.product?.title || '—'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {formatDate(booking.schedule?.date)} — {formatTime(booking.schedule?.time)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {getPaymentMethodLabel(booking.paymentMethod)}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleConfirmPayment(booking._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition"
                    >
                      <CheckCircle size={16} />
                      {t('admin.pending_payments.confirm_payment_mobile')}
                    </button>
                    <button
                      onClick={() => handleOpenRejectModal(booking._id, booking.user?.name || t('admin.common.client'))}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition"
                    >
                      <XCircle size={16} />
                      {t('admin.common.reject')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ScrollToTopButton />
      </div>

      <RejectModal
        isOpen={rejectModal.isOpen}
        onClose={handleCloseRejectModal}
        onConfirm={handleRejectConfirm}
        bookingId={rejectModal.bookingId}
        clientName={rejectModal.clientName}
      />
    </div>
  );
};

export default AdminPendingPaymentsPage;
