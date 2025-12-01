import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, ChevronRight, AlertCircle } from 'lucide-react';
import api from '../config/axios';

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { product, date, timeSlot, tickets } = location.state || {};
  
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [travelerDetails, setTravelerDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

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
        } else {
          setAvailableSlots(relevantSchedules);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching schedules:', error);
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [product, date, timeSlot, navigate]);

  const handleContinue = async () => {
    if (!selectedSlot) return;
    
    // If it's a virtual schedule, we need to create it first
    let scheduleToUse = selectedSlot;
    
    if (selectedSlot._id && selectedSlot._id.startsWith('virtual_')) {
      try {
        // Create schedule on backend
        const { data: newSchedule } = await api.post(`/api/products/${product._id}/schedules`, {
          date: date,
          time: timeSlot.startTime,
          endTime: timeSlot.endTime,
          capacity: 100,
          price: product.price || 0,
          currency: 'EUR'
        });
        scheduleToUse = newSchedule;
      } catch (error) {
        console.error('Failed to create schedule:', error);
        alert('Erreur lors de la création du créneau. Veuillez réessayer.');
        return;
      }
    }
    
    navigate('/checkout', {
      state: {
        product,
        schedule: scheduleToUse,
        numberOfTickets: tickets,
        travelerDetails,
        date,
        timeSlot
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
              <span className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center mr-2">1</span>
              Details
            </div>
            <div className="w-12 h-0.5 bg-slate-200 mx-4"></div>
            <div className="flex items-center text-slate-400">
              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mr-2">2</span>
              Payment
            </div>
            <div className="w-12 h-0.5 bg-slate-200 mx-4"></div>
            <div className="flex items-center text-slate-400">
              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mr-2">3</span>
              Confirmation
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-8">Confirmer les détails</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {/* Time Selection */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Clock className="mr-2 text-primary-600" size={20} />
                  Select a time
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
                        className={`p-4 rounded-xl border-2 text-left transition ${
                          selectedSlot?._id === slot._id
                            ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-600 ring-offset-2'
                            : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-lg mb-1">{slot.time}</div>
                        <div className="text-sm text-slate-600">
                          {new Date(slot.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-sm font-medium text-primary-700 mt-2">
                          €{slot.price.toFixed(2)}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-orange-50 text-orange-700 rounded-lg flex items-start">
                    <AlertCircle className="mr-2 mt-0.5 flex-shrink-0" size={18} />
                    <p>No available time slots found for these dates. Please try selecting different dates.</p>
                  </div>
                )}
              </div>

              {/* Traveler Details */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Users className="mr-2 text-primary-600" size={20} />
                  Traveler Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={travelerDetails.firstName}
                      onChange={e => setTravelerDetails({...travelerDetails, firstName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={travelerDetails.lastName}
                      onChange={e => setTravelerDetails({...travelerDetails, lastName: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={travelerDetails.email}
                      onChange={e => setTravelerDetails({...travelerDetails, email: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={travelerDetails.phone}
                      onChange={e => setTravelerDetails({...travelerDetails, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 sticky top-24">
                <h3 className="font-bold text-lg mb-4">Order Summary</h3>
                
                <div className="flex gap-3 mb-4 pb-4 border-b border-slate-100">
                  <img 
                    src={product.images[0]} 
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
                    <span className="text-slate-600">Date</span>
                    <span className="font-medium">
                      {date && new Date(date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {timeSlot && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Plage horaire</span>
                      <span className="font-medium">{timeSlot.startTime} - {timeSlot.endTime}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tickets</span>
                    <span className="font-medium">{tickets}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="font-bold text-xl text-primary-700">
                      €{selectedSlot ? (selectedSlot.price * tickets).toFixed(2) : '---'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleContinue}
                  disabled={!selectedSlot || !travelerDetails.firstName || !travelerDetails.email}
                  className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  Continue to Payment
                  <ChevronRight size={18} className="ml-2" />
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
