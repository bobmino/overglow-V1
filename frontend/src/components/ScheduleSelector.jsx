import React from 'react';
import { Clock, Users } from 'lucide-react';

const ScheduleSelector = ({ schedules, selectedSchedule, onSelectSchedule }) => {
  if (!Array.isArray(schedules) || schedules.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600">No schedules available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg mb-4">Select Date & Time</h3>
      {schedules.map((schedule) => {
        const isSelected = selectedSchedule?._id === schedule._id;
        const availableSpots = schedule.capacity - (schedule.bookings?.length || 0);
        
        return (
          <button
            key={schedule._id}
            onClick={() => onSelectSchedule(schedule)}
            className={`w-full text-left p-4 rounded-lg border-2 transition ${
              isSelected 
                ? 'border-green-700 bg-green-50' 
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900">
                  {new Date(schedule.date).toLocaleDateString('fr-FR', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Clock size={14} className="mr-1" />
                  {schedule.time}
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-lg text-gray-900">€{schedule.price}</p>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <Users size={12} className="mr-1" />
                  {availableSpots} spots left
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ScheduleSelector;
