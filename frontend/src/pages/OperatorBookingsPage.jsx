import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import { Calendar, Clock, Users, Mail, ExternalLink, MessageSquare, ArrowRightCircle, CheckCircle } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';
import InternalNoteModal from '../components/InternalNoteModal';

const OperatorBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/api/operator/bookings');
      const bookingsArray = Array.isArray(data) ? data : [];
      setBookings(bookingsArray);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setBookings([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleMarkHandled = async (bookingId) => {
    try {
      await api.put(`/api/bookings/${bookingId}/handle`);
      fetchBookings();
    } catch (error) {
      console.error('Failed to mark booking as handled:', error);
      alert('Failed to mark booking as handled');
    }
  };

  const handleOpenNoteModal = (booking) => {
    setSelectedBooking(booking);
    setShowNoteModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Réservations reçues</h1>
        <DashboardNavBar />
      </div>

      {bookings.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No bookings yet</h2>
          <p className="text-gray-600">Bookings will appear here once customers book your products</p>
        </div>
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
                    <Mail size={14} className="mr-1" />
                    {booking.user?.email}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                  {booking.isHandled && (
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
                      <CheckCircle size={12} />
                      Géré
                    </span>
                  )}
                  {booking.internalNote && (
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      Note
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center text-gray-700">
                  <Calendar size={16} className="mr-2 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-semibold">
                      {new Date(booking.schedule?.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-gray-700">
                  <Clock size={16} className="mr-2 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="font-semibold">{booking.schedule?.time}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-700">
                  <Users size={16} className="mr-2 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Tickets</p>
                    <p className="font-semibold">{booking.numberOfTickets}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Revenue</p>
                  <p className="text-xl font-bold text-green-700">€{booking.totalAmount.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                <a
                  href={`mailto:${booking.user?.email}`}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  <Mail size={16} />
                  Contacter
                </a>
                <button
                  onClick={() => window.open(`/products/${booking.schedule?.product?._id || booking.schedule?.product}`, '_blank')}
                  className="inline-flex items-center gap-2 text-gray-700 hover:text-green-700 font-semibold"
                >
                  <ExternalLink size={16} />
                  Voir le produit
                </button>
                <button
                  onClick={() => handleOpenNoteModal(booking)}
                  className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold"
                >
                  <MessageSquare size={16} />
                  {booking.internalNote ? 'Modifier note' : 'Note interne'}
                </button>
                {!booking.isHandled && (
                  <button
                    onClick={() => handleMarkHandled(booking._id)}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold"
                  >
                    <ArrowRightCircle size={16} />
                    Marquer comme géré
                  </button>
                )}
                {booking.isHandled && (
                  <span className="inline-flex items-center gap-2 text-gray-500 font-semibold">
                    <CheckCircle size={16} />
                    Déjà géré
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
