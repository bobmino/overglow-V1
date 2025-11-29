import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, MapPin, Clock, Users, XCircle, X, Star, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReviewModal from '../components/ReviewModal';

const CancelModal = ({ booking, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    await onConfirm(booking._id);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900">Cancel Booking?</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Are you sure you want to cancel your booking for <strong>{booking.schedule?.product?.title}</strong>?
          This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Keep Booking
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition ${loading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'
              }`}
          >
            {loading ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

const BookingCard = ({ booking, onBookingCancelled }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await axios.put(`/api/bookings/${bookingId}/cancel`);
      setShowCancelModal(false);
      onBookingCancelled();
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Failed to cancel booking');
    }
  };

  const isPastBooking = () => {
    const bookingDate = new Date(booking.schedule?.date);
    return bookingDate < new Date() && booking.status === 'Confirmed';
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">
              {booking.schedule?.product?.title || 'Product'}
            </h3>
            <div className="flex items-center text-gray-600 text-sm mb-1">
              <MapPin size={14} className="mr-1" />
              {booking.schedule?.product?.city}
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(booking.status)}`}>
            {booking.status}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-700">
            <Calendar size={16} className="mr-2 text-gray-400" />
            {new Date(booking.schedule?.date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div className="flex items-center text-gray-700">
            <Clock size={16} className="mr-2 text-gray-400" />
            {booking.schedule?.time}
          </div>
          <div className="flex items-center text-gray-700">
            <Users size={16} className="mr-2 text-gray-400" />
            {booking.numberOfTickets} ticket{booking.numberOfTickets > 1 ? 's' : ''}
          </div>
        </div>

        <div className="border-t pt-4 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">Total</span>
            <p className="text-xl font-bold text-gray-900">€{(booking.totalAmount || 0).toFixed(2)}</p>
          </div>
          <div className="flex gap-2">
            {booking.status === 'Confirmed' && !isPastBooking() && (
              <>
                <Link
                  to={`/products/${booking.schedule?.product?._id}`}
                  className="text-green-700 font-semibold hover:underline"
                >
                  View Details
                </Link>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex items-center text-red-600 font-semibold hover:underline"
                >
                  <XCircle size={16} className="mr-1" />
                  Cancel
                </button>
              </>
            )}
            {isPastBooking() && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="flex items-center text-green-700 font-semibold hover:underline"
              >
                <Star size={16} className="mr-1" />
                Write Review
              </button>
            )}
          </div>
        </div>
      </div>

      {showCancelModal && (
        <CancelModal
          booking={booking}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelBooking}
        />
      )}

      {showReviewModal && (
        <ReviewModal
          booking={booking}
          onClose={() => setShowReviewModal(false)}
          onSubmitted={onBookingCancelled}
        />
      )}
    </>
  );
};

const DashboardPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    try {
      const { data } = await axios.get('/api/bookings/my-bookings');
      setBookings(data);
      setLoading(false);
    } catch (err) {
      console.error('Booking fetch error:', err);
      setError('Failed to load bookings');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mes réservations</h1>
        <Link
          to="/dashboard/inquiries"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
        >
          Mes Inquiries
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No bookings yet</h2>
          <p className="text-gray-600 mb-6">Start exploring and book your next adventure!</p>
          <Link
            to="/search"
            className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-800 transition"
          >
            Explore Experiences
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <BookingCard key={booking._id} booking={booking} onBookingCancelled={fetchBookings} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
