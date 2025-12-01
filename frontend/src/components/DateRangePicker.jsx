import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const DateRangePicker = ({ onDateSelect, selectedDates = [], product = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastClickedDay, setLastClickedDay] = useState(null);
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

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    clickedDate.setHours(0, 0, 0, 0);
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;
    const isDoubleClick = timeSinceLastClick < 300 && lastClickedDay === day;
    
    setLastClickTime(now);
    setLastClickedDay(day);
    
    if (isDoubleClick) {
      // Double-click: validate single day selection
      setStartDate(clickedDate);
      setEndDate(null);
      // Auto-apply after double-click
      setTimeout(() => {
        onDateSelect({ start: clickedDate, end: clickedDate, isSingleDay: true });
        setIsOpen(false);
      }, 100);
      return;
    }
    
    if (!startDate || (startDate && endDate)) {
      // Start new selection
      setStartDate(clickedDate);
      setEndDate(null);
    } else {
      // Complete the range
      if (clickedDate.getTime() === startDate.getTime()) {
        // Same day clicked - treat as single day
        setEndDate(null);
      } else if (clickedDate < startDate) {
        setEndDate(startDate);
        setStartDate(clickedDate);
      } else {
        setEndDate(clickedDate);
      }
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleApply = () => {
    if (startDate) {
      // If no endDate, it's a single day selection
      const dateRange = { 
        start: startDate, 
        end: endDate || startDate, 
        isSingleDay: !endDate,
        timeSlot: selectedTimeSlot
      };
      onDateSelect(dateRange);
      setIsOpen(false);
    }
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setHoverDate(null);
  };

  const isDateInRange = (date) => {
    if (!startDate) return false;
    if (!endDate && !hoverDate) return date.getTime() === startDate.getTime();
    
    const rangeEnd = endDate || hoverDate;
    return date >= startDate && date <= rangeEnd;
  };

  const isDateSelected = (date) => {
    if (!startDate) return false;
    if (date.getTime() === startDate.getTime()) return true;
    if (endDate && date.getTime() === endDate.getTime()) return true;
    return false;
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(currentMonth);
    const firstDay = firstDayOfMonth(currentMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-3"></div>);
    }

    // Actual days
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isPast = date < today;
      const inRange = isDateInRange(date);
      const isSelected = isDateSelected(date);

      days.push(
        <button
          key={day}
          type="button"
          disabled={isPast}
          onClick={() => !isPast && handleDateClick(day)}
          onMouseEnter={() => !isPast && setHoverDate(date)}
          className={`p-3 rounded-lg text-center transition-all text-base font-semibold min-h-[44px] flex items-center justify-center border ${
            isPast
              ? 'text-slate-300 cursor-not-allowed bg-slate-50 border-slate-200'
              : isSelected
              ? 'bg-primary-600 text-white font-bold ring-2 ring-primary-600 border-primary-600'
              : inRange
              ? 'bg-primary-100 text-primary-700 border-primary-300'
              : 'hover:bg-slate-100 text-slate-700 bg-white border-slate-300 hover:border-primary-400'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const formatDisplayDate = () => {
    if (!startDate) return 'Select a date below';
    
    const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (!endDate) {
      return formatDate(startDate);
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const getAvailableTimeSlots = () => {
    if (!product || !Array.isArray(product.timeSlots) || product.timeSlots.length === 0) {
      return [{ startTime: '09:00', endTime: '17:00' }];
    }
    return product.timeSlots;
  };

  const timeSlots = Array.isArray(getAvailableTimeSlots()) ? getAvailableTimeSlots() : [{ startTime: '09:00', endTime: '17:00' }];
  
  // Initialize selected time slot if not set
  useEffect(() => {
    if (timeSlots.length > 0 && !selectedTimeSlot) {
      setSelectedTimeSlot(timeSlots[0]);
    }
  }, [timeSlots]);

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-left flex items-center justify-between hover:border-primary-500 transition"
      >
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date & Time</label>
          <span className={`text-base font-medium ${startDate ? 'text-slate-800' : 'text-slate-400'}`}>
            {formatDisplayDate()}
          </span>
          {Array.isArray(timeSlots) && timeSlots.length > 0 && (
            <div className="mt-2 text-xs text-slate-500">
              Horaires: {timeSlots.map(slot => `${slot.startTime}-${slot.endTime}`).join(', ')}
            </div>
          )}
        </div>
        <Calendar size={20} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-[9999] w-full min-w-[400px] animate-in fade-in slide-in-from-top-2">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-lg font-bold text-slate-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-bold text-slate-600 p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4 min-h-[300px]">
            {renderCalendar()}
          </div>

          {/* Time Slots Selection */}
          {Array.isArray(timeSlots) && timeSlots.length > 0 && startDate && (
            <div className="mb-4 pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Sélectionner une plage horaire:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      selectedTimeSlot && 
                      selectedTimeSlot.startTime === slot.startTime && 
                      selectedTimeSlot.endTime === slot.endTime
                        ? 'bg-primary-600 text-white ring-2 ring-primary-600'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {slot.startTime} - {slot.endTime}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selection Info */}
          {startDate && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              {!endDate ? (
                <span>Jour sélectionné: <strong>{startDate.toLocaleDateString('fr-FR')}</strong>. Double-cliquez pour valider ou sélectionnez un autre jour pour une plage.</span>
              ) : (
                <span>Plage sélectionnée: <strong>{startDate.toLocaleDateString('fr-FR')}</strong> au <strong>{endDate.toLocaleDateString('fr-FR')}</strong></span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!startDate}
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
