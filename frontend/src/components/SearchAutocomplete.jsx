import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search as SearchIcon } from 'lucide-react';
import axios from 'axios';

const SearchAutocomplete = ({ value, onChange, placeholder = "Search for a place or activity" }) => {
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
          const { data } = await axios.get(`/api/search/autocomplete?q=${value}`);
          setSuggestions(data);
          setIsOpen(true);
          setLoading(false);
        } catch (error) {
          console.error('Autocomplete error:', error);
          setLoading(false);
        }
      }, 300);
    } else {
      setSuggestions({ cities: [], activities: [], showNearby: false });
      setIsOpen(false);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value]);

  const handleSelect = (selection) => {
    onChange(selection);
    setIsOpen(false);
  };

  const handleNearby = () => {
    onChange('Nearby');
    setIsOpen(false);
  };

  const hasSuggestions = suggestions.cities.length > 0 || suggestions.activities.length > 0;

  return (
    <div className="relative w-full" ref={autocompleteRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400 font-medium text-lg pr-8"
        />
        {loading && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {isOpen && (hasSuggestions || suggestions.showNearby) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-[9999] max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
          {/* Nearby Option */}
          {suggestions.showNearby && (
            <>
              <button
                onClick={handleNearby}
                className="w-full px-4 py-3 hover:bg-slate-50 transition flex items-center gap-3 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                  <Navigation size={18} className="text-primary-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Nearby</div>
                  <div className="text-xs text-slate-500">Discover activities near you</div>
                </div>
              </button>
              <div className="border-t border-slate-100 my-2"></div>
            </>
          )}

          {/* Cities */}
          {suggestions.cities.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Destinations
              </div>
              {suggestions.cities.map((city, index) => (
                <button
                  key={`city-${index}`}
                  onClick={() => handleSelect(city.name)}
                  className="w-full px-4 py-2 hover:bg-slate-50 transition flex items-center gap-3 text-left"
                >
                  <MapPin size={16} className="text-slate-400" />
                  <div>
                    <span className="font-medium text-slate-900">{city.name}</span>
                    {city.country && <span className="text-slate-500 text-sm ml-2">{city.country}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Activities */}
          {suggestions.activities.length > 0 && (
            <div>
              {suggestions.cities.length > 0 && <div className="border-t border-slate-100 my-2"></div>}
              <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Activities
              </div>
              {suggestions.activities.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => handleSelect(activity.title)}
                  className="w-full px-4 py-2 hover:bg-slate-50 transition text-left"
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
