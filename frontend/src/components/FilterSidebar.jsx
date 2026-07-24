import React, { useState, useEffect } from 'react';
import { Search, Filter as FilterIcon, Check, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FilterCheckRow = ({ checked, onChange, children }) => (
  <label className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-x-3 w-full cursor-pointer group py-0.5">
    <span className="relative col-start-1 row-start-1 flex items-center justify-center w-5 h-5">
      <span
        className={`flex items-center justify-center w-5 h-5 rounded border transition-colors pointer-events-none ${
          checked
            ? 'bg-primary-600 border-primary-600'
            : 'border-slate-300 bg-white group-hover:border-primary-500'
        }`}
        aria-hidden
      >
        {checked && <Check size={14} className="text-white" />}
      </span>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </span>
    <span className="col-start-2 row-start-1 text-sm text-slate-700 group-hover:text-slate-900 min-w-0">
      {children}
    </span>
  </label>
);

const FilterRadioRow = ({ checked, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-x-3 w-full text-start cursor-pointer group py-0.5"
  >
    <span
      className={`col-start-1 row-start-1 flex items-center justify-center w-5 h-5 rounded-full border transition-colors ${
        checked ? 'border-4 border-primary-600' : 'border-slate-300 group-hover:border-primary-500'
      }`}
      aria-hidden
    />
    <span className="col-start-2 row-start-1 text-sm text-slate-700 group-hover:text-slate-900 min-w-0">
      {children}
    </span>
  </button>
);

const REASSURANCE_TAG_IDS = [
  { id: 'annulation-gratuite', labelKey: 'filters.tag_free_cancel', color: 'bg-primary-100 text-primary-700' },
  { id: 'confirmation-immediate', labelKey: 'filters.tag_instant', color: 'bg-blue-100 text-blue-700' },
];

const CANCELLATION_TYPES = [
  { id: 'free', labelKey: 'filters.cancel_free' },
  { id: 'moderate', labelKey: 'filters.cancel_moderate' },
  { id: 'strict', labelKey: 'filters.cancel_strict' },
  { id: 'non_refundable', labelKey: 'filters.cancel_non_refundable' },
];

const FilterSidebar = ({
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  categories,
  selectedCategories,
  setSelectedCategories,
  taxonomyOptions = [],
  selectedTaxonomy = [],
  setSelectedTaxonomy,
  cities = [],
  selectedCity = '',
  setSelectedCity,
  onReset,
  storeMode = null,
  filterProfile = null,
  compact = false,
}) => {
  const { t } = useTranslation();
  const profile =
    filterProfile ||
    (storeMode === 'stays'
      ? 'stay'
      : storeMode === 'extras'
        ? 'service'
        : storeMode === 'explore'
          ? 'tour'
          : null);
  const isStay = profile === 'stay';
  const showTaxonomyFilters = profile === 'tour' || profile === 'service';
  const showReassuranceTags = profile !== 'stay';
  const showCancellation = profile !== 'stay';

  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice || '');
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== searchQuery) {
        setSearchQuery(localQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        minPrice: localMinPrice !== '' ? Number(localMinPrice) : null,
        maxPrice: localMaxPrice !== '' ? Number(localMaxPrice) : null,
      }));
    }, 500);
    return () => clearTimeout(timer);
  }, [localMinPrice, localMaxPrice, setFilters]);

  useEffect(() => {
    setLocalQuery(searchQuery || '');
  }, [searchQuery]);

  useEffect(() => {
    setLocalMinPrice(filters.minPrice ?? '');
    setLocalMaxPrice(filters.maxPrice ?? '');
  }, [filters.minPrice, filters.maxPrice]);

  const handleCategoryToggle = (categoryName) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleTaxonomyToggle = (slug) => {
    if (typeof setSelectedTaxonomy !== 'function') return;
    setSelectedTaxonomy((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleTagToggle = (tagId) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((t) => t !== tagId)
      : [...currentTags, tagId];
    setFilters((prev) => ({ ...prev, tags: newTags }));
  };

  const hasTaxonomy = showTaxonomyFilters && Array.isArray(taxonomyOptions) && taxonomyOptions.length > 0;

  const activeFiltersCount =
    (selectedCategories?.length || 0) +
    (selectedTaxonomy?.length || 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.tags?.length || 0) +
    (filters.cancellationType ? 1 : 0) +
    (filters.propertyType ? 1 : 0) +
    (filters.pool || filters.garden || filters.wifi || filters.jacuzzi ? 1 : 0) +
    (selectedCity ? 1 : 0) +
    (searchQuery ? 1 : 0);

  return (
    <div
      className={
        compact
          ? 'bg-transparent p-0'
          : 'bg-white rounded-2xl border border-slate-200 p-6 shadow-sm'
      }
    >
      {!compact && (
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-xl text-slate-900 flex items-center">
          <FilterIcon size={22} className="me-2" />
          {t('catalog.filters')}
          {activeFiltersCount > 0 && (
            <span className="ms-2 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </h2>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={() => {
              onReset();
              setLocalQuery('');
              setLocalMinPrice('');
              setLocalMaxPrice('');
            }}
            className="text-sm text-slate-500 hover:text-primary-600 font-medium transition-colors"
          >
            {t('common.clear')}
          </button>
        )}
      </div>
      )}

      <div className="space-y-6 divide-y divide-slate-100">
        <div className="pt-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={t('catalog.search_placeholder')}
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className="w-full ps-10 pe-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
            />
          </div>
        </div>

        {typeof setSelectedCity === 'function' && cities.length > 0 && (
          <div className="pt-6">
            <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">
              {t('catalog.cities')}
            </h3>
            <select
              value={selectedCity || ''}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{t('catalog.all_cities')}</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        )}

        {hasTaxonomy && (
          <div className="pt-6">
            <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">
              {profile === 'service'
                ? t('stores.extras.service_type')
                : t('catalog.category')}
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
              {taxonomyOptions.map((opt) => {
                const isActive =
                  Array.isArray(selectedTaxonomy) && selectedTaxonomy.includes(opt.slug);
                return (
                  <FilterCheckRow
                    key={opt.slug}
                    checked={isActive}
                    onChange={() => handleTaxonomyToggle(opt.slug)}
                  >
                    <span className="flex items-center justify-between gap-2 w-full">
                      <span>
                        {opt.parentLabel ? `${opt.parentLabel} · ` : ''}
                        {opt.label}
                      </span>
                      {typeof opt.count === 'number' && opt.count > 0 && (
                        <span className="text-xs text-slate-400 shrink-0">{opt.count}</span>
                      )}
                    </span>
                  </FilterCheckRow>
                );
              })}
            </div>
          </div>
        )}

        {!hasTaxonomy && showTaxonomyFilters && Array.isArray(categories) && categories.length > 0 && (
        <div className="pt-6">
          <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">
            {profile === 'service'
              ? t('stores.extras.service_type')
              : t('catalog.category')}
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
            {categories.map((cat) => {
                const categoryName = typeof cat === 'object' ? cat.name || cat.slug : cat;
                const isActive =
                  Array.isArray(selectedCategories) && selectedCategories.includes(categoryName);
                return (
                  <FilterCheckRow
                    key={categoryName}
                    checked={isActive}
                    onChange={() => handleCategoryToggle(categoryName)}
                  >
                    {categoryName}
                  </FilterCheckRow>
                );
              })}
          </div>
        </div>
        )}

        {showReassuranceTags && (
        <div className="pt-6">
          <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">
            {t('catalog.popular')}
          </h3>
          <div className="space-y-2">
            {REASSURANCE_TAG_IDS.map((tag) => {
              const isActive = filters.tags?.includes(tag.id);
              return (
                <FilterCheckRow
                  key={tag.id}
                  checked={isActive}
                  onChange={() => handleTagToggle(tag.id)}
                >
                  <span className={`inline-flex font-medium px-2 py-0.5 rounded-md ${tag.color}`}>
                    {t(tag.labelKey)}
                  </span>
                </FilterCheckRow>
              );
            })}
          </div>
        </div>
        )}

        {showCancellation && (
        <div className="pt-6">
          <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">
            {t('filters.cancellation_policy')}
          </h3>
          <div className="space-y-2">
            {CANCELLATION_TYPES.map((opt) => {
              const isActive = filters.cancellationType === opt.id;
              return (
                <FilterRadioRow
                  key={opt.id}
                  checked={isActive}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      cancellationType: isActive ? null : opt.id,
                    }))
                  }
                >
                  {t(opt.labelKey)}
                </FilterRadioRow>
              );
            })}
          </div>
        </div>
        )}

        <div className="pt-6">
          <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">
            {t('catalog.price_mad')}
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder={t('catalog.min_price')}
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
              className="w-full min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500"
              min="0"
            />
            <span className="text-slate-400 font-medium shrink-0">-</span>
            <input
              type="number"
              placeholder={t('catalog.max_price')}
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              className="w-full min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500"
              min="0"
            />
          </div>
        </div>

        <div className="pt-6">
          <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">
            {t('catalog.min_rating')}
          </h3>
          <div className="space-y-2">
            {[5, 4, 3].map((rating) => {
              const isActive = filters.minRating === rating;
              return (
                <FilterRadioRow
                  key={rating}
                  checked={isActive}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      minRating: isActive ? null : rating,
                    }))
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    {[...Array(rating)].map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-slate-600 ms-1">
                      {rating === 5 ? '5.0' : `${rating}.0+`}
                    </span>
                  </span>
                </FilterRadioRow>
              );
            })}
          </div>
        </div>

        {isStay && (
          <div className="pt-6">
            <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">
              {t('stores.stays.property_type')}
            </h3>
            <div className="space-y-2 mb-4">
              {[
                { id: 'villa', labelKey: 'stores.stays.type_villa' },
                { id: 'riad', labelKey: 'stores.stays.type_riad' },
                { id: 'apartment', labelKey: 'stores.stays.type_apartment' },
                { id: 'suite', labelKey: 'stores.stays.type_suite' },
              ].map((pt) => {
                const isActive = filters.propertyType === pt.id;
                return (
                  <FilterCheckRow
                    key={pt.id}
                    checked={isActive}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        propertyType: isActive ? null : pt.id,
                      }))
                    }
                  >
                    {t(pt.labelKey)}
                  </FilterCheckRow>
                );
              })}
            </div>
            <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">
              {t('stores.stays.amenities')}
            </h3>
            <div className="space-y-2">
              {[
                { id: 'pool', labelKey: 'stores.stays.amenity_pool' },
                { id: 'garden', labelKey: 'stores.stays.amenity_garden' },
                { id: 'wifi', labelKey: 'stores.stays.amenity_wifi' },
                { id: 'jacuzzi', labelKey: 'stores.stays.amenity_jacuzzi' },
              ].map((am) => {
                const isActive = !!filters[am.id];
                return (
                  <FilterCheckRow
                    key={am.id}
                    checked={isActive}
                    onChange={() =>
                      setFilters((prev) => ({ ...prev, [am.id]: !prev[am.id] }))
                    }
                  >
                    {t(am.labelKey)}
                  </FilterCheckRow>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterSidebar;
