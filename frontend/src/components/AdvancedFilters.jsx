import React, { useState } from 'react';
import { Filter, X, MapPin, Clock, Star, Calendar } from 'lucide-react';

const AdvancedFilters = ({ 
  filters, 
  onFiltersChange, 
  onReset,
  cities = [],
  categories = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleDurationChange = (duration) => {
    const currentDurations = filters.durations || [];
    const newDurations = currentDurations.includes(duration)
      ? currentDurations.filter(d => d !== duration)
      : [...currentDurations, duration];
    handleFilterChange('durations', newDurations);
  };

  const activeFiltersCount = 
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.durations?.length || 0) +
    (filters.selectedDate ? 1 : 0) +
    (filters.location?.lat ? 1 : 0) +
    (filters.radius ? 1 : 0);

  const durationOptions = [
    { value: '0-2', label: 'Moins de 2h' },
    { value: '2-4', label: '2-4 heures' },
    { value: '4-8', label: '4-8 heures' },
    { value: '1-day', label: '1 jour' },
    { value: 'multi-day', label: 'Plusieurs jours' }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center font-bold text-lg text-slate-900 hover:text-primary-600 transition"
        >
          <Filter size={20} className="mr-2" />
          Filtres Avancés
          {activeFiltersCount > 0 && (
            <span className="ml-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
        {activeFiltersCount > 0 && (
          <button
            onClick={onReset}
            className="text-sm text-primary-600 hover:underline font-medium"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Price Range */}
          <div>
            <h3 className="font-semibold mb-3 text-slate-900 flex items-center">
              <span className="mr-2">Prix (MAD)</span>
            </h3>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice || ''}
                onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="0"
              />
              <span className="text-slate-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice || ''}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="0"
              />
            </div>
          </div>

          {/* Duration Filter */}
          <div>
            <h3 className="font-semibold mb-3 text-slate-900 flex items-center">
              <Clock size={16} className="mr-2" />
              Durée
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {durationOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={filters.durations?.includes(option.value) || false}
                    onChange={() => handleDurationChange(option.value)}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-slate-700 text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <h3 className="font-semibold mb-3 text-slate-900 flex items-center">
              <Star size={16} className="mr-2" />
              Note Minimale
            </h3>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Note min"
                value={filters.minRating || ''}
                onChange={(e) => handleFilterChange('minRating', e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="0"
                max="5"
                step="0.1"
              />
              <span className="text-slate-500 text-sm">étoiles</span>
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <h3 className="font-semibold mb-3 text-slate-900 flex items-center">
              <Calendar size={16} className="mr-2" />
              Date
            </h3>
            <input
              type="date"
              value={filters.selectedDate || ''}
              onChange={(e) => handleFilterChange('selectedDate', e.target.value || null)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Location-based Search */}
          <div>
            <h3 className="font-semibold mb-3 text-slate-900 flex items-center">
              <MapPin size={16} className="mr-2" />
              Recherche par Proximité
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Ville ou adresse"
                  value={filters.locationName || ''}
                  onChange={(e) => handleFilterChange('locationName', e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          handleFilterChange('location', {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                          });
                        },
                        (error) => {
                          console.error('Geolocation error:', error);
                          alert('Impossible d\'obtenir votre position');
                        }
                      );
                    } else {
                      alert('La géolocalisation n\'est pas supportée par votre navigateur');
                    }
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                >
                  Ma position
                </button>
              </div>
              {filters.location?.lat && (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Rayon (km)"
                    value={filters.radius || ''}
                    onChange={(e) => handleFilterChange('radius', e.target.value ? Number(e.target.value) : null)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="1"
                    max="100"
                  />
                  <button
                    onClick={() => {
                      handleFilterChange('location', null);
                      handleFilterChange('locationName', '');
                      handleFilterChange('radius', null);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;

