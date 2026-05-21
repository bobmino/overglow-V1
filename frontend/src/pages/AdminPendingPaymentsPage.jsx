import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';
import { useToast } from '../context/ToastContext';
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
  AlertCircle,
  X,
} from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

// Format date helper
const formatDate = (rawDate) => {
  if (!rawDate) return '—';
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Format time helper
const formatTime = (time) => {
  if (!time) return '—';
  return time;
};

// Format amount in MAD
const formatAmount = (value) => {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('fr-FR')} MAD`;
};

// Get payment method label
const getPaymentMethodLabel = (method) => {
  const labels = {
    bank_transfer: 'Virement bancaire',
    cash_pickup: 'Paiement sur place',
    cash_delivery: 'Paiement à la livraison',
    stripe: 'Carte bancaire',
    paypal: 'PayPal',
    cmi: 'CMI',
  };
  return labels[method] || method || '—';
};

// Reject Modal Component
const RejectModal = ({ isOpen, onClose, onConfirm, bookingId, clientName }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast('Le motif de rejet est obligatoire', { type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await api.put(`/api/admin/bookings/${bookingId}/reject-payment`, {
        rejectionReason: reason.trim(),
      });
      toast('Paiement rejeté avec succès', { type: 'success' });
      onConfirm();
      onClose();
      setReason('');
    } catch (error) {
      console.error('Reject payment error:', error);
      toast(error.response?.data?.message || 'Erreur lors du rejet', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <XCircle size={24} className="text-white" />
            <h2 className="text-xl font-bold text-white">Rejeter le paiement</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-gray-600 text-sm">
            Client : <span className="font-semibold text-gray-900">{clientName}</span>
          </p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Motif de rejet <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Virement non reçu, Référence incorrecte..."
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
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Envoi...' : 'Confirmer le rejet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPendingPaymentsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState({ isOpen: false, bookingId: null, clientName: '' });
  const { toast } = useToast();

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/admin/bookings/pending-payments');
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch pending payments:', error);
      toast('Impossible de charger les paiements en attente', { type: 'error' });
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
      toast('Paiement confirmé avec succès', { type: 'success' });
      fetchPendingPayments();
    } catch (error) {
      console.error('Confirm payment error:', error);
      toast(error.response?.data?.message || 'Erreur lors de la confirmation', { type: 'error' });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/dashboard"
              className="p-2 rounded-xl bg-white/60 backdrop-blur-md border border-gray-200 hover:border-emerald-400 transition shadow-sm"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Paiements à valider</h1>
              <p className="text-gray-500 text-sm mt-1">
                Gérez les réservations en attente de paiement offline
              </p>
            </div>
          </div>
          <DashboardNavBar />
        </div>

        {/* Stats Banner */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-100">
                <Clock size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">En attente</p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100">
                <DollarSign size={24} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Montant total</p>
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
                <p className="text-gray-500 text-sm">Méthodes</p>
                <p className="text-sm text-gray-700 font-medium">Virement / Sur place</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600" />
          </div>
        )}

        {/* Empty State */}
        {!loading && bookings.length === 0 && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
            <div className="inline-flex p-4 rounded-full bg-emerald-100 mb-4">
              <CheckCircle size={40} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun paiement en attente</h3>
            <p className="text-gray-500">Toutes les réservations ont été traitées</p>
          </div>
        )}

        {/* Bookings Table */}
        {!loading && bookings.length > 0 && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Méthode
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((booking) => (
                    <tr
                      key={booking._id}
                      className="hover:bg-emerald-50/30 transition"
                    >
                      {/* Reference */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-mono font-bold text-amber-700">
                          <Clock size={12} />
                          {booking.paymentReference || `OG-${booking._id.slice(-8).toUpperCase()}`}
                        </span>
                      </td>

                      {/* Client */}
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

                      {/* Product */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-100">
                            <Package size={16} className="text-emerald-600" />
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

                      {/* Date */}
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

                      {/* Amount */}
                      <td className="px-6 py-4 text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatAmount(booking.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {booking.numberOfTickets} billet{booking.numberOfTickets > 1 ? 's' : ''}
                        </p>
                      </td>

                      {/* Payment Method */}
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

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleConfirmPayment(booking._id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm hover:shadow-md"
                          >
                            <CheckCircle size={14} />
                            Confirmer
                          </button>
                          <button
                            onClick={() => handleOpenRejectModal(booking._id, booking.user?.name || 'Client')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition shadow-sm hover:shadow-md"
                          >
                            <XCircle size={14} />
                            Rejeter
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-100">
              {bookings.map((booking) => (
                <div key={booking._id} className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-mono font-bold text-amber-700">
                      {booking.paymentReference || `OG-${booking._id.slice(-8).toUpperCase()}`}
                    </span>
                    <p className="text-lg font-bold text-gray-900">
                      {formatAmount(booking.totalAmount)}
                    </p>
                  </div>

                  {/* Client */}
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-700 font-medium">
                      {booking.user?.name || '—'}
                    </span>
                  </div>

                  {/* Product */}
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {booking.schedule?.product?.title || '—'}
                    </span>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {formatDate(booking.schedule?.date)} — {formatTime(booking.schedule?.time)}
                    </span>
                  </div>

                  {/* Payment Method */}
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {getPaymentMethodLabel(booking.paymentMethod)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleConfirmPayment(booking._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition"
                    >
                      <CheckCircle size={16} />
                      Confirmer le paiement
                    </button>
                    <button
                      onClick={() => handleOpenRejectModal(booking._id, booking.user?.name || 'Client')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition"
                    >
                      <XCircle size={16} />
                      Rejeter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ScrollToTopButton />
      </div>

      {/* Reject Modal */}
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
