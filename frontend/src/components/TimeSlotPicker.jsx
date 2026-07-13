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
    if (!product || !Array.isArray(product.timeSlots) || product.timeSlots.length === 0) {
      return [{ startTime: '09:00', endTime: '17:00' }];
    }
    return product.timeSlots;
  };

  const timeSlots = Array.isArray(getAvailableTimeSlots()) ? getAvailableTimeSlots() : [{ startTime: '09:00', endTime: '17:00' }];

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
        data-testid="time-slot-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border-2 rounded-xl text-start flex items-center justify-between transition ${
          required && !selectedTimeSlot
            ? 'border-red-300 bg-red-50'
            : selectedTimeSlot
            ? 'border-primary-500 bg-primary-50'
            : 'border-slate-300 hover:border-primary-500'
        }`}
      >
        <div className="flex items-center gap-3">
          <Clock size={18} className="text-slate-400" />
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-0.5">
              Plage horaire {required && <span className="text-red-500">*</span>}
            </label>
            <span className={`text-sm font-medium ${selectedTimeSlot ? 'text-slate-800' : 'text-slate-400'}`}>
              {selectedTimeSlot ? formatTimeSlot(selectedTimeSlot) : 'Sélectionner une plage horaire'}
            </span>
          </div>
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div data-testid="time-slot-picker-dropdown" className="absolute top-full start-0 end-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-[9999] w-full">
          <div className="space-y-2">
            {timeSlots.map((slot, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSlotSelect(slot)}
                className={`w-full px-3 py-2 rounded-lg text-start transition text-sm ${
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
