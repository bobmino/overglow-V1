import React, { useState } from 'react';
import { Search, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchAutocomplete from './SearchAutocomplete';
import DatePicker from './DatePicker';

const HeroSection = () => {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const normalizedQuery = String(destination || '').trim();
    if (normalizedQuery) {
      params.append('q', normalizedQuery);
    }
    if (date) {
      // Format as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      params.append('date', formattedDate);
    }
    navigate(`/search?${params.toString()}`);
  };

  const handleAutocompleteSelect = (selection) => {
    if (selection?.type === 'product' && (selection.slug || selection.id)) {
      navigate(`/experiences/${selection.slug || selection.id}`);
      return;
    }
    if (selection?.type === 'city' && selection.city) {
      setDestination(selection.city);
    }
  };

  return (
    <section className="relative h-[85vh] min-h-[650px] w-full flex items-center justify-center overflow-visible">
      {/* Background Image - Premium Unsplash URL */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1539650116574-8efeb43e2750?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
          alt="Premium Travel Destination"
          className="w-full h-full object-cover object-center"
        />
        {/* Subtle overlay for better text readability and premium feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/65 mix-blend-multiply"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center mt-[-6vh]">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-extrabold text-white tracking-tight mb-6 drop-shadow-xl">
          L'évasion à <span className="text-primary-400">l'état pur</span>
        </h1>
        <p className="text-xl md:text-3xl text-white/90 font-medium max-w-3xl mb-12 drop-shadow-md">
          Découvrez des expériences inoubliables et des séjours d'exception sélectionnés pour vous.
        </p>

        {/* Floating Search Pill */}
        <div className="w-full max-w-4xl relative z-[100]">
          <form 
            onSubmit={handleSearch}
            className="bg-white rounded-full p-2 md:p-3 flex flex-col md:flex-row items-center gap-2 md:gap-4 shadow-2xl backdrop-blur-xl bg-white/95 border border-white/20 transition-transform duration-300 hover:scale-[1.01]"
          >
            {/* Destination Search */}
            <div className="flex-1 flex flex-col items-start px-6 w-full md:border-r border-slate-200">
              <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <MapPin size={12} className="text-primary-500" />
                Où allez-vous ?
              </label>
              <SearchAutocomplete
                value={destination}
                onChange={setDestination}
                onSelect={handleAutocompleteSelect}
                placeholder="Rechercher Agadir, Surf, etc."
              />
            </div>
            
            {/* Date Selection */}
            <div className="flex-1 flex flex-col items-stretch px-6 w-full md:pr-4">
              <DatePicker 
                selectedDate={date}
                onDateSelect={setDate}
              />
            </div>

            {/* Search Submit Button */}
            <button 
              type="submit"
              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-full py-4 px-10 font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-105"
            >
              <Search size={22} strokeWidth={2.5} />
              <span>Rechercher</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
