import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Calendar, MapPin, Clock, Users } from 'lucide-react';
import { trackBooking } from '../utils/analytics';

const BookingSuccessPage = () => {
  const location = useLocation();
  const { booking } = location.state || {};

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
    }
  }, [booking]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No booking information found</p>
          <Link to="/" className="text-green-700 font-semibold hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const resolvedTotalPrice = typeof booking.totalPrice === 'number'
    ? booking.totalPrice
    : (typeof booking.totalAmount === 'number'
        ? booking.totalAmount
        : (booking.schedule?.price || 0) * (booking.numberOfTickets || 0));

  const formattedTotalPrice = Number.isFinite(resolvedTotalPrice)
    ? resolvedTotalPrice.toFixed(2)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle size={48} className="text-green-700" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600">Your reservation has been successfully confirmed</p>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            <h2 className="text-xl font-bold mb-6">Booking Details</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Booking Reference</p>
                <p className="font-bold text-lg">#{booking._id?.slice(-8).toUpperCase()}</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-gray-900 mb-3">
                  {booking.schedule?.product?.title || 'Experience'}
                </h3>
                
                <div className="space-y-2 text-gray-700">
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-400" />
                    {booking.schedule?.product?.city}
                  </div>
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2 text-gray-400" />
                    {new Date(booking.schedule?.date).toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2 text-gray-400" />
                    {booking.schedule?.time}
                  </div>
                  <div className="flex items-center">
                    <Users size={16} className="mr-2 text-gray-400" />
                    {booking.numberOfTickets} ticket{booking.numberOfTickets > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Paid</span>
                  <span className="text-2xl font-bold text-green-700">
                    {formattedTotalPrice ? `€${formattedTotalPrice}` : 'Amount unavailable'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-6">
            <h3 className="font-bold text-blue-900 mb-3">What's Next?</h3>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>• A confirmation email has been sent to your email address</li>
              <li>• You can view and manage your booking in your dashboard</li>
              <li>• Free cancellation is available up to 24 hours before the experience</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/dashboard" 
              className="flex-1 bg-green-700 text-white text-center py-3 rounded-lg font-bold hover:bg-green-800 transition"
            >
              View My Bookings
            </Link>
            <Link 
              to="/" 
              className="flex-1 bg-white border-2 border-gray-300 text-gray-700 text-center py-3 rounded-lg font-bold hover:bg-gray-50 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;
