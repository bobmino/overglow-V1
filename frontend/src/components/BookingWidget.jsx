import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users } from 'lucide-react';

const BookingWidget = ({ product, selectedSchedule, numberOfTickets, onTicketsChange }) => {
  const navigate = useNavigate();
  const basePrice = selectedSchedule?.price || 99;
  const total = basePrice * numberOfTickets;

  const handleReserve = () => {
    if (selectedSchedule) {
      navigate('/checkout', {
        state: {
          product,
          schedule: selectedSchedule,
          numberOfTickets
        }
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 sticky top-24">
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-1">From</p>
        <p className="text-3xl font-bold text-gray-900">€{basePrice}</p>
        <p className="text-sm text-gray-500">per person</p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="border rounded-lg p-3">
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
            <Calendar size={16} className="mr-2" />
            Date & Time
          </label>
          {selectedSchedule ? (
            <p className="text-gray-900">
              {new Date(selectedSchedule.date).toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} - {selectedSchedule.time}
            </p>
          ) : (
            <p className="text-gray-500 text-sm">Select a date below</p>
          )}
        </div>

        <div className="border rounded-lg p-3">
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
            <Users size={16} className="mr-2" />
            Tickets
          </label>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onTicketsChange(Math.max(1, numberOfTickets - 1))}
              className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-green-700 transition font-bold"
            >
              -
            </button>
            <span className="font-bold text-lg w-8 text-center">{numberOfTickets}</span>
            <button 
              onClick={() => onTicketsChange(numberOfTickets + 1)}
              className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-green-700 transition font-bold"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">€{basePrice} × {numberOfTickets} ticket{numberOfTickets > 1 ? 's' : ''}</span>
          <span className="font-bold text-gray-900">€{total}</span>
        </div>
      </div>

      <button 
        onClick={handleReserve}
        disabled={!selectedSchedule}
        className={`w-full py-3 rounded-lg font-bold text-white transition ${
          selectedSchedule 
            ? 'bg-green-700 hover:bg-green-800' 
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        {selectedSchedule ? 'Reserve Now' : 'Select a date first'}
      </button>

      <p className="text-xs text-gray-500 text-center mt-3">
        You won't be charged yet
      </p>
    </div>
  );
};

export default BookingWidget;
