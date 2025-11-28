import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const DatePicker = ({ onDateSelect, selectedDate = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(selectedDate);
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
    setSelectedDay(clickedDate);
    onDateSelect(clickedDate);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
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
      const isSelected = selectedDay && date.getTime() === selectedDay.getTime();

      days.push(
        <button
          key={day}
          type="button"
          disabled={isPast}
          onClick={() => !isPast && handleDateClick(day)}
          className={`p-3 rounded-lg text-center transition-all text-base font-semibold min-h-[44px] flex items-center justify-center border ${
            isPast
              ? 'text-slate-300 cursor-not-allowed bg-slate-50 border-slate-200'
              : isSelected
              ? 'bg-primary-600 text-white font-bold ring-2 ring-primary-600 border-primary-600'
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
    if (!selectedDay) return 'Sélectionner une date';
    return selectedDay.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-left flex items-center justify-between hover:border-primary-500 transition"
      >
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
          <span className={`text-base font-medium ${selectedDay ? 'text-slate-800' : 'text-slate-400'}`}>
            {formatDisplayDate()}
          </span>
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
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
              <div key={day} className="text-center text-sm font-bold text-slate-600 p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 min-h-[300px] max-h-[400px] overflow-y-auto">
            {renderCalendar()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
