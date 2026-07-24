import React, { useMemo, useRef } from 'react';
import { SlidersHorizontal, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Barre sticky Viator-like : Filtres + pills scrollables.
 */
const CatalogFilterBar = ({
  resultLabel = '',
  onOpenFilters,
  pills = [],
  activePillKeys = [],
  onPillToggle,
  cities = [],
  selectedCity = '',
  onCityChange,
  sortBy = 'recommended',
  onSortChange,
}) => {
  const { t } = useTranslation();
  const scrollerRef = useRef(null);

  const sortOptions = useMemo(
    () => [
      { value: 'recommended', label: t('catalog.sort_recommended') },
      { value: 'price-low', label: t('catalog.sort_price_low') },
      { value: 'price-high', label: t('catalog.sort_price_high') },
      { value: 'rating', label: t('catalog.sort_rating') },
      { value: 'popularity', label: t('catalog.sort_popularity') },
    ],
    [t]
  );

  return (
    <div className="sticky top-16 md:top-[72px] z-30 -mx-4 px-4 py-3 bg-slate-50/95 backdrop-blur border-b border-slate-200/80 mb-6 supports-[backdrop-filter]:bg-slate-50/90">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <p className="text-sm font-medium text-slate-700">{resultLabel}</p>
        <label className="text-sm text-slate-600 flex items-center gap-2">
          <span className="hidden sm:inline shrink-0">{t('catalog.sort_by')}</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="bg-white border border-slate-200 rounded-full px-3 py-2 text-sm min-h-10 max-w-[11rem] sm:max-w-none"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenFilters}
          className="shrink-0 inline-flex items-center gap-2 min-h-10 px-4 py-2 rounded-full border border-slate-900 bg-white text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          <SlidersHorizontal size={16} />
          {t('catalog.filters')}
        </button>

        {typeof onCityChange === 'function' && cities.length > 0 && (
          <select
            value={selectedCity || ''}
            onChange={(e) => onCityChange(e.target.value)}
            className="shrink-0 min-h-10 max-w-[9.5rem] bg-white border border-slate-200 rounded-full px-3 py-2 text-sm font-medium"
          >
            <option value="">{t('catalog.all_cities')}</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        )}

        <div
          ref={scrollerRef}
          className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide py-0.5"
        >
          {pills.map((pill) => {
            const active = activePillKeys.includes(pill.key);
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => onPillToggle?.(pill)}
                className={`shrink-0 inline-flex items-center gap-1.5 min-h-10 px-3.5 py-2 rounded-full border text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-primary-400'
                }`}
              >
                {pill.label}
                {active && <X size={14} className="opacity-90" />}
              </button>
            );
          })}
        </div>

        {pills.length > 4 && (
          <button
            type="button"
            onClick={() => {
              scrollerRef.current?.scrollBy({ left: 180, behavior: 'smooth' });
            }}
            className="hidden sm:inline-flex shrink-0 w-10 h-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600"
            aria-label={t('carousel.scroll_right', 'Suite')}
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default CatalogFilterBar;
