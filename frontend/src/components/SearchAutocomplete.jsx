import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search as SearchIcon } from 'lucide-react';
import api from '../config/axios';
import { logger } from '../utils/logger.js';

const SearchAutocomplete = ({ value = '', onChange, onSelect, placeholder = "Search for a place or activity" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState({ cities: [], activities: [], showNearby: false });
  const [loading, setLoading] = useState(false);
  const autocompleteRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Debounced search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (value && value.length >= 2) {
      setLoading(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const { data } = await api.get(`/api/search/autocomplete?q=${value}`);
          setSuggestions({
            cities: Array.isArray(data?.cities) ? data.cities : [],
            activities: Array.isArray(data?.activities) ? data.activities : [],
            showNearby: Boolean(data?.showNearby),
          });
          setIsOpen(true);
          setLoading(false);
        } catch (error) {
          logger.error('Autocomplete error:', error);
          setLoading(false);
        }
      }, 300);
    } else {
      setSuggestions({ cities: [], activities: [], showNearby: true });
      setIsOpen(false);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value]);

  const safeCall = (fn, payload) => {
    if (typeof fn === 'function') fn(payload);
  };

  const handleSelect = (selection) => {
    safeCall(onChange, typeof selection === 'string' ? selection : selection?.label || '');
    safeCall(onSelect, selection);
    setIsOpen(false);
  };

  const handleNearby = () => {
    safeCall(onChange, 'À proximité');
    safeCall(onSelect, { type: 'nearby', label: 'À proximité' });
    setIsOpen(false);
  };

  const defaultCities = [
    { name: 'Agadir' },
    { name: 'Taghazout' },
    { name: 'Marrakech' },
  ];
  const apiCities = Array.isArray(suggestions?.cities) ? suggestions.cities : [];
  const activities = Array.isArray(suggestions?.activities) ? suggestions.activities : [];

  // Fallback 3 villes uniquement au focus (saisie < 2). Après saisie, on respecte l’API.
  const cities = value.length >= 2 ? apiCities : defaultCities;
  const hasSuggestions = cities.length > 0 || activities.length > 0;

  return (
    <div className="relative w-full" ref={autocompleteRef}>
      <div className="relative">
        <label htmlFor="search-autocomplete" className="sr-only">Rechercher des expériences ou destinations</label>
        <input
          type="text"
          id="search-autocomplete"
          name="search-autocomplete"
          value={value}
          onChange={(e) => safeCall(onChange, e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400 font-medium text-lg pe-8"
          autoComplete="off"
          aria-label="Rechercher des expériences ou destinations"
        />
        {loading && (
          <div className="absolute end-0 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {isOpen && (hasSuggestions || suggestions?.showNearby) && (
        <div className="absolute top-full start-0 end-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-[9999] max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Nearby Option */}
          {suggestions?.showNearby && (
            <>
              <button
                onClick={handleNearby}
                className="w-full px-4 py-3 hover:bg-slate-50 transition flex items-center gap-3 text-start"
              >
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                  <Navigation size={18} className="text-primary-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">À proximité</div>
                  <div className="text-xs text-slate-500">Activités autour de vous</div>
                </div>
              </button>
              <div className="border-t border-slate-100 my-2"></div>
            </>
          )}

          {/* Cities */}
          {cities.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Destinations
              </div>
              {cities.map((city, index) => (
                <button
                  key={`city-${index}`}
                  onClick={() => handleSelect({ type: 'city', label: city.name, city: city.name })}
                  className="w-full px-4 py-2 hover:bg-slate-50 transition flex items-center gap-3 text-start"
                >
                  <MapPin size={16} className="text-slate-400" />
                  <div>
                    <span className="font-medium text-slate-900">{city.name}</span>
                    {city.country && <span className="text-slate-500 text-sm ms-2">{city.country}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Activities */}
          {activities.length > 0 && (
            <div>
              {cities.length > 0 && <div className="border-t border-slate-100 my-2"></div>}
              <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Activités
              </div>
              {activities.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => handleSelect({
                    type: 'product',
                    label: activity.title,
                    id: activity.id,
                    slug: activity.slug,
                    city: activity.city,
                  })}
                  className="w-full px-4 py-2 hover:bg-slate-50 transition text-start"
                >
                  <div className="flex items-start gap-3">
                    <SearchIcon size={16} className="text-slate-400 mt-1" />
                    <div>
                      <div className="font-medium text-slate-900 line-clamp-1">{activity.title}</div>
                      <div className="text-xs text-slate-500">
                        {activity.city} • {activity.category}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
