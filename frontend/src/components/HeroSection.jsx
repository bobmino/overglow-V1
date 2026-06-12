import React, { useState } from 'react';
import { Search, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <section className="relative h-[80vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden">
      {/* Background Image - Premium Unsplash URL */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1539650116574-8efeb43e2750?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
          alt="Premium Travel Destination"
          className="w-full h-full object-cover object-center"
        />
        {/* Subtle overlay for better text readability and premium feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 mix-blend-multiply"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center mt-[-10vh]">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-extrabold text-white tracking-tight mb-6 drop-shadow-lg">
          L'évasion à <span className="text-primary-400">l'état pur</span>
        </h1>
        <p className="text-lg md:text-2xl text-white/90 font-medium max-w-2xl mb-12 drop-shadow-md">
          Découvrez des expériences inoubliables et des séjours d'exception sélectionnés pour vous.
        </p>

        {/* Floating Search Pill */}
        <div className="w-full max-w-3xl">
          <form 
            onSubmit={handleSearch}
            className="bg-white rounded-full p-2 md:p-3 flex flex-col md:flex-row items-center gap-2 md:gap-4 shadow-2xl backdrop-blur-xl bg-white/95 transition-transform hover:scale-[1.01]"
          >
            <div className="flex-1 flex items-center px-4 w-full md:border-r border-slate-200">
              <MapPin className="text-slate-400 mr-3 shrink-0" size={20} />
              <input
                type="text"
                placeholder="Où allez-vous ?"
                className="w-full bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 font-medium text-lg outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex-1 flex items-center px-4 w-full hidden md:flex">
              <Calendar className="text-slate-400 mr-3 shrink-0" size={20} />
              <input
                type="text"
                placeholder="Quand ?"
                className="w-full bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 font-medium text-lg outline-none cursor-pointer"
                readOnly
                onClick={() => navigate('/search')}
              />
            </div>

            <button 
              type="submit"
              className="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white rounded-full py-3 md:py-4 px-8 font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-primary-600/30"
            >
              <Search size={20} />
              <span>Rechercher</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
