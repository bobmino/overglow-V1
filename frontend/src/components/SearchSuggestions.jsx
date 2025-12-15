import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, X, TrendingUp } from 'lucide-react';
import api from '../config/axios';

/**
 * Search suggestions component with autocomplete and history
 */
const SearchSuggestions = ({ 
  searchQuery, 
  onSelect, 
  onClear,
  showSuggestions = true 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory).slice(0, 5)); // Last 5 searches
      } catch (e) {
        console.error('Failed to parse search history:', e);
      }
    }
  }, []);

  // Load trending searches (mock data for now)
  useEffect(() => {
    // In production, this would come from an API
    setTrending([
      'Marrakech',
      'Tours guidés',
      'Souk traditionnel',
      'Atlas Mountains',
      'Cuisine marocaine'
    ]);
  }, []);

  // Fetch suggestions from API
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        // Mock API call - replace with actual endpoint
        const { data } = await api.get(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
        setSuggestions(data.suggestions || []);
      } catch (error) {
        // Fallback: generate simple suggestions
        const mockSuggestions = [
          `${searchQuery} à Marrakech`,
          `${searchQuery} à Casablanca`,
          `${searchQuery} guidé`,
          `Expériences ${searchQuery}`,
        ];
        setSuggestions(mockSuggestions.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSelect = (suggestion) => {
    // Save to history
    const newHistory = [
      suggestion,
      ...history.filter(item => item !== suggestion)
    ].slice(0, 10);
    
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    
    onSelect(suggestion);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('searchHistory');
  };

  if (!showSuggestions || (!suggestions.length && !history.length && !trending.length)) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto"
    >
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Suggestions
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSelect(suggestion)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg flex items-center gap-2 transition"
            >
              <Search size={16} className="text-gray-400" />
              <span className="text-gray-700">{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search History */}
      {history.length > 0 && (
        <div className="p-2 border-t border-gray-100">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Clock size={14} />
              Historique
            </div>
            <button
              onClick={handleClearHistory}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <X size={12} />
              Effacer
            </button>
          </div>
          {history.map((item, index) => (
            <button
              key={index}
              onClick={() => handleSelect(item)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg flex items-center gap-2 transition"
            >
              <Clock size={16} className="text-gray-400" />
              <span className="text-gray-700">{item}</span>
            </button>
          ))}
        </div>
      )}

      {/* Trending Searches */}
      {trending.length > 0 && searchQuery.length < 2 && (
        <div className="p-2 border-t border-gray-100">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp size={14} />
            Tendances
          </div>
          <div className="flex flex-wrap gap-2 px-3 pb-2">
            {trending.map((item, index) => (
              <button
                key={index}
                onClick={() => handleSelect(item)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;

