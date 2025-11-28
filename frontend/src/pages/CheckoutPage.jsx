import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, Users, MapPin, CreditCard, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PaymentSelector from '../components/PaymentSelector';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { product, schedule, numberOfTickets } = location.state || {};

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
    }
    if (!product || !schedule) {
      navigate('/');
    }
  }, [isAuthenticated, product, schedule, navigate, location]);

  const totalPrice = schedule?.price * numberOfTickets;

  const handlePaymentComplete = async (paymentDetails) => {
    setLoading(true);
    setError('');

    try {
      const { data } = await axios.post('/api/bookings', {
        scheduleId: schedule._id,
        numberOfTickets: numberOfTickets,
        paymentMethod: paymentDetails.type,
        paymentId: paymentDetails.id
      });

      navigate('/booking-success', { state: { booking: data } });
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
      setLoading(false);
    }
  };

  if (!product || !schedule) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete your booking</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking Summary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-4">Booking Details</h2>
                <div className="flex gap-4">
                  <img 
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=200'} 
                    alt={product.title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">{product.title}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin size={14} className="mr-2" />
                        {product.city}
                      </div>
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2" />
                        {new Date(schedule.date).toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="flex items-center">
                        <Clock size={14} className="mr-2" />
                        {schedule.time}
                      </div>
                      <div className="flex items-center">
                        <Users size={14} className="mr-2" />
                        {numberOfTickets} ticket{numberOfTickets > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Selection */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <CreditCard size={24} className="mr-2" />
                  Payment Information
                </h2>
                
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                  </div>
                )}

                <PaymentSelector 
                  amount={totalPrice} 
                  onPaymentComplete={handlePaymentComplete} 
                />
              </div>
            </div>

            {/* Price Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-4">Price Summary</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-700">
                    <span>€{schedule.price.toFixed(2)} × {numberOfTickets} ticket{numberOfTickets > 1 ? 's' : ''}</span>
                    <span>€{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Service fee</span>
                    <span>€0.00</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-green-700">€{totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  Free cancellation up to 24 hours before the experience starts
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
