import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCityImage } from '../../config/cityMedia';

const HERO_BY_STORE = {
  explore: { city: 'Marrakech', accent: 'from-primary-950/85 via-primary-900/70 to-primary-800/40' },
  stays: { city: 'Fès', accent: 'from-primary-950/90 via-amber-950/55 to-primary-900/35' },
  extras: { city: 'Casablanca', accent: 'from-slate-950/90 via-primary-950/65 to-primary-900/40' },
};

/**
 * Hero store full-bleed — identité Overglow, atmosphère photo réelle.
 */
const StoreCatalogHero = ({ storeKey = 'explore', title, subtitle, onOpenFilters }) => {
  const { t } = useTranslation();
  const meta = HERO_BY_STORE[storeKey] || HERO_BY_STORE.explore;
  const image = getCityImage(meta.city, 'hero');

  return (
    <section className="relative w-full min-h-[42vh] sm:min-h-[38vh] md:min-h-[44vh] overflow-hidden">
      <img
        src={image}
        alt=""
        className="absolute inset-0 w-full h-full object-cover scale-105"
        loading="eager"
        decoding="async"
      />
      <div className={`absolute inset-0 bg-gradient-to-r ${meta.accent}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 via-transparent to-primary-950/30" />

      <div className="relative container mx-auto px-4 pt-28 pb-10 md:pt-32 md:pb-14 flex flex-col justify-end min-h-[42vh] sm:min-h-[38vh] md:min-h-[44vh]">
        <p className="text-secondary-500 font-heading font-bold text-sm sm:text-base tracking-[0.28em] uppercase mb-3 drop-shadow">
          Overglow
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-extrabold text-white tracking-tight max-w-3xl drop-shadow-sm">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 text-base sm:text-lg text-white/90 max-w-xl leading-relaxed">
            {subtitle}
          </p>
        ) : null}
        {typeof onOpenFilters === 'function' && (
          <div className="mt-6">
            <button
              type="button"
              onClick={onOpenFilters}
              className="inline-flex items-center gap-2 min-h-11 px-5 py-2.5 rounded-full bg-white text-primary-900 font-bold text-sm shadow-lg hover:bg-primary-50 transition"
            >
              <SlidersHorizontal size={16} />
              {t('catalog.filters')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default StoreCatalogHero;
