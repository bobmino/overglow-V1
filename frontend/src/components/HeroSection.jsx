import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SearchAutocomplete from './SearchAutocomplete';
import DatePicker from './DatePicker';
import { useLocalizedNavigate } from '../hooks/useLocalizedPath';

const HeroSection = () => {
  const navigate = useLocalizedNavigate();
  const { t } = useTranslation();
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const normalizedQuery = String(destination || '').trim();
    if (normalizedQuery) params.append('q', normalizedQuery);
    if (date) params.append('date', date.toISOString().split('T')[0]);
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
    <section className="relative h-[85vh] min-h-[480px] sm:min-h-[580px] md:min-h-[650px] w-full flex items-center justify-center overflow-x-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-home.webp"
          alt={t('home.hero_alt')}
          className="w-full h-full object-cover object-center"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-black/50 md:from-black/25 md:via-black/10 md:to-black/35 md:mix-blend-normal mix-blend-multiply" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center mt-[-6vh]">
        <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-heading font-extrabold text-white tracking-tight mb-6 drop-shadow-xl">
          {t('home.hero_title_before')}{' '}
          <span className="text-primary-400">{t('home.hero_title_accent')}</span>
        </h1>
        <p className="text-lg sm:text-xl md:text-3xl text-white/90 font-medium max-w-3xl mb-8 sm:mb-12 drop-shadow-md">
          {t('home.hero_subtitle')}
        </p>

        <div className="w-full max-w-4xl relative z-[100]">
          <form
            onSubmit={handleSearch}
            className="bg-white rounded-full p-2 md:p-3 flex flex-col md:flex-row items-center gap-2 md:gap-4 shadow-2xl backdrop-blur-xl bg-white/95 border border-white/20 transition-transform duration-300 hover:scale-[1.01]"
          >
            <div className="flex-1 flex flex-col items-start px-6 w-full md:border-e border-slate-200">
              <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <MapPin size={12} className="text-primary-500" />
                {t('home.search_where')}
              </label>
              <SearchAutocomplete
                value={destination}
                onChange={setDestination}
                onSelect={handleAutocompleteSelect}
                placeholder={t('home.search_placeholder')}
              />
            </div>

            <div className="flex-1 flex flex-col items-stretch px-6 w-full md:pe-4">
              <DatePicker selectedDate={date} onDateSelect={setDate} />
            </div>

            <button
              type="submit"
              className="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white rounded-full py-4 px-10 font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-105"
            >
              <Search size={22} strokeWidth={2.5} />
              <span>{t('common.search')}</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
