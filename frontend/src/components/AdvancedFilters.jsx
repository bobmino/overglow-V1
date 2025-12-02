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
            <label className="font-semibold mb-3 text-slate-900 flex items-center block">
              <span className="mr-2">Prix (MAD)</span>
            </label>
            <div className="flex items-center space-x-2">
              <label htmlFor="advanced-price-min" className="sr-only">Prix minimum</label>
              <input
                type="number"
                id="advanced-price-min"
                name="advanced-price-min"
                placeholder="Min"
                value={filters.minPrice || ''}
                onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="0"
                aria-label="Prix minimum en dirhams marocains"
              />
              <span className="text-slate-500" aria-hidden="true">-</span>
              <label htmlFor="advanced-price-max" className="sr-only">Prix maximum</label>
              <input
                type="number"
                id="advanced-price-max"
                name="advanced-price-max"
                placeholder="Max"
                value={filters.maxPrice || ''}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="0"
                aria-label="Prix maximum en dirhams marocains"
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
              {durationOptions.map((option) => {
                const durationId = `duration-${option.value}`;
                return (
                  <label key={option.value} htmlFor={durationId} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                    <input
                      type="checkbox"
                      id={durationId}
                      name={durationId}
                      checked={filters.durations?.includes(option.value) || false}
                      onChange={() => handleDurationChange(option.value)}
                      className="rounded text-primary-600 focus:ring-primary-500"
                      aria-label={`Filtrer par durée ${option.label}`}
                    />
                    <span className="text-slate-700 text-sm">{option.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="font-semibold mb-3 text-slate-900 flex items-center block">
              <Star size={16} className="mr-2" />
              Note Minimale
            </label>
            <div className="flex items-center space-x-2">
              <label htmlFor="min-rating" className="sr-only">Note minimale</label>
              <input
                type="number"
                id="min-rating"
                name="min-rating"
                placeholder="Note min"
                value={filters.minRating || ''}
                onChange={(e) => handleFilterChange('minRating', e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="0"
                max="5"
                step="0.1"
                aria-label="Note minimale en étoiles"
              />
              <span className="text-slate-500 text-sm" aria-hidden="true">étoiles</span>
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <label htmlFor="selected-date" className="font-semibold mb-3 text-slate-900 flex items-center block">
              <Calendar size={16} className="mr-2" />
              Date
            </label>
            <input
              type="date"
              id="selected-date"
              name="selected-date"
              value={filters.selectedDate || ''}
              onChange={(e) => handleFilterChange('selectedDate', e.target.value || null)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              aria-label="Sélectionner une date"
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
                <label htmlFor="location-name" className="sr-only">Ville ou adresse</label>
                <input
                  type="text"
                  id="location-name"
                  name="location-name"
                  placeholder="Ville ou adresse"
                  value={filters.locationName || ''}
                  onChange={(e) => handleFilterChange('locationName', e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  aria-label="Rechercher par ville ou adresse"
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
                  <label htmlFor="radius" className="sr-only">Rayon de recherche en kilomètres</label>
                  <input
                    type="number"
                    id="radius"
                    name="radius"
                    placeholder="Rayon (km)"
                    value={filters.radius || ''}
                    onChange={(e) => handleFilterChange('radius', e.target.value ? Number(e.target.value) : null)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="1"
                    max="100"
                    aria-label="Rayon de recherche en kilomètres"
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

