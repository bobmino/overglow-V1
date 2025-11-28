import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

const TimeSlotPicker = ({ product, selectedTimeSlot, onTimeSlotSelect, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAvailableTimeSlots = () => {
    if (!product || !product.timeSlots || product.timeSlots.length === 0) {
      return [{ startTime: '09:00', endTime: '17:00' }];
    }
    return product.timeSlots;
  };

  const timeSlots = getAvailableTimeSlots();

  const formatTimeSlot = (slot) => {
    return `${slot.startTime} - ${slot.endTime}`;
  };

  const handleSlotSelect = (slot) => {
    onTimeSlotSelect(slot);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border-2 rounded-xl text-left flex items-center justify-between transition ${
          required && !selectedTimeSlot
            ? 'border-red-300 bg-red-50'
            : selectedTimeSlot
            ? 'border-primary-500 bg-primary-50'
            : 'border-slate-300 hover:border-primary-500'
        }`}
      >
        <div className="flex items-center gap-3">
          <Clock size={20} className="text-slate-400" />
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Plage horaire {required && <span className="text-red-500">*</span>}
            </label>
            <span className={`text-base font-medium ${selectedTimeSlot ? 'text-slate-800' : 'text-slate-400'}`}>
              {selectedTimeSlot ? formatTimeSlot(selectedTimeSlot) : 'Sélectionner une plage horaire'}
            </span>
          </div>
        </div>
        <ChevronDown size={20} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-[9999] w-full">
          <div className="space-y-2">
            {timeSlots.map((slot, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSlotSelect(slot)}
                className={`w-full px-4 py-3 rounded-lg text-left transition ${
                  selectedTimeSlot &&
                  selectedTimeSlot.startTime === slot.startTime &&
                  selectedTimeSlot.endTime === slot.endTime
                    ? 'bg-primary-600 text-white font-semibold ring-2 ring-primary-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium'
                }`}
              >
                {formatTimeSlot(slot)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotPicker;

