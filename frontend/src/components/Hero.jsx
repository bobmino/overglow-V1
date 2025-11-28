import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DatePicker from './DatePicker';
import SearchAutocomplete from './SearchAutocomplete';

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.append('city', destination);
    if (date) params.append('date', date);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="relative h-[600px] w-full flex items-center justify-center overflow-visible">
      {/* Background Image with Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent"></div>
      </div>

      <div className="relative z-10 text-center w-full max-w-5xl px-4 animate-in fade-in zoom-in duration-700">
        <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6 drop-shadow-2xl tracking-tight leading-tight">
          {t('hero.title')}
        </h1>
        <p className="text-xl md:text-2xl text-slate-100 mb-10 drop-shadow-lg font-light max-w-2xl mx-auto">
          {t('hero.subtitle')}
        </p>

        {/* Floating Glass Search Bar */}
        <form onSubmit={handleSearch} className="bg-white/90 backdrop-blur-xl rounded-2xl p-3 flex flex-col md:flex-row items-center shadow-2xl max-w-4xl mx-auto border border-white/20">
          <div className="flex-1 w-full md:w-auto px-6 py-3 border-b md:border-b-0 md:border-r border-slate-200/60 group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 text-left group-focus-within:text-primary-600 transition-colors">{t('hero.where')}</label>
            <SearchAutocomplete
              value={destination}
              onChange={setDestination}
              placeholder={t('hero.searchPlaceholder')}
            />
          </div>
          
          <div className="flex-1 w-full md:w-auto px-6 py-3 group">
            <DatePicker 
              value={date}
              onChange={setDate}
              placeholder="Select Dates"
            />
          </div>

          <button type="submit" className="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-8 py-4 m-1 transition-all shadow-lg shadow-primary-600/30 hover:shadow-primary-600/50 hover:scale-105 flex items-center justify-center">
            <Search size={24} strokeWidth={2.5} />
            <span className="md:hidden ml-2 font-bold">Search</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Hero;
