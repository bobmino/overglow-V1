import React, { useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { X, SlidersHorizontal, Sparkles } from 'lucide-react';
import api from '../config/axios';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import FilterDrawer from '../components/FilterDrawer';
import { trackSearch } from '../utils/analytics';
import {
  CURATED_EXTRAS,
  CURATED_STAYS_TEASERS,
  STORE_CONFIG,
  EXPLORE_CATEGORY_WHITELIST,
  EXTRAS_CATEGORY_VALUES,
} from '../data/storeCatalog';
import { normalizeCategory } from '../utils/categoryMapping';

const pathToStore = (pathname) => {
  if (pathname.startsWith('/explore')) return 'explore';
  if (pathname.startsWith('/stays')) return 'stays';
  if (pathname.startsWith('/extras')) return 'extras';
  return null;
};

/**
 * URL is the source of truth for catalogue filters.
 * Store routes (/explore, /stays, /extras) force productType.
 */
const SearchPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = React.useState(false);

  const storeKey = pathToStore(location.pathname);
  const store = storeKey ? STORE_CONFIG[storeKey] : null;
  const lockedProductType = store?.productType || '';

  // Lock productType on store landings
  useEffect(() => {
    if (!lockedProductType) return;
    const current = searchParams.get('productType');
    if (current !== lockedProductType) {
      const next = new URLSearchParams(searchParams);
      next.set('productType', lockedProductType);
      setSearchParams(next, { replace: true });
    }
  }, [lockedProductType, searchParams, setSearchParams]);

  const filtersFromUrl = useMemo(() => {
    const tagsParam = searchParams.get('tags');
    const categoryParam = searchParams.get('category') || '';
    const categoryGroupParam = searchParams.get('categoryGroup') || '';
    const productTypeParam = lockedProductType || searchParams.get('productType') || '';
    return {
      q: searchParams.get('q') || '',
      city: searchParams.get('city') || '',
      category: categoryParam,
      categories: categoryParam ? categoryParam.split(',').filter(Boolean) : [],
      productType: productTypeParam,
      categoryGroup: categoryGroupParam,
      propertyType: searchParams.get('propertyType') || '',
      pool: searchParams.get('pool') === 'true',
      garden: searchParams.get('garden') === 'true',
      wifi: searchParams.get('wifi') === 'true',
      jacuzzi: searchParams.get('jacuzzi') === 'true',
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null,
      minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : null,
      skipTheLine: searchParams.get('skipTheLine') === 'true',
      tags: tagsParam ? tagsParam.split(',').filter(Boolean) : [],
      sortBy: searchParams.get('sortBy') || 'recommended',
      page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
    };
  }, [searchParams, lockedProductType]);

  const updateParams = useCallback(
    (patch, { resetPage = true } = {}) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([key, value]) => {
        if (
          value === null ||
          value === undefined ||
          value === '' ||
          (Array.isArray(value) && value.length === 0) ||
          value === false
        ) {
          next.delete(key);
        } else if (Array.isArray(value)) {
          next.set(key, value.join(','));
        } else {
          next.set(key, String(value));
        }
      });
      if (lockedProductType) next.set('productType', lockedProductType);
      if (resetPage) next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, lockedProductType]
  );

  const { data: facetsData } = useQuery({
    queryKey: ['searchFacets', lockedProductType || 'all'],
    queryFn: async () => {
      const params = lockedProductType ? `?productType=${lockedProductType}` : '';
      const { data } = await api.get(`/api/search/facets${params}`);
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const cities = (facetsData?.cities || []).map((c) => c.name).filter(Boolean);

  const categories = useMemo(() => {
    const fromFacets = (facetsData?.categories || []).map((c) => c.name).filter(Boolean);

    if (storeKey === 'stays') return [];

    if (storeKey === 'extras') {
      if (fromFacets.length === 0) return EXTRAS_CATEGORY_VALUES;
      const merged = [
        ...EXTRAS_CATEGORY_VALUES.filter((name) => fromFacets.includes(name)),
        ...fromFacets.filter((n) => !EXTRAS_CATEGORY_VALUES.includes(n)),
      ];
      return merged.length > 0 ? merged : EXTRAS_CATEGORY_VALUES;
    }

    if (storeKey === 'explore') {
      const filtered = fromFacets.filter((name) => {
        const n = normalizeCategory(name) || name;
        return EXPLORE_CATEGORY_WHITELIST.some(
          (w) => w.toLowerCase() === String(n).toLowerCase()
        );
      });
      return filtered.length > 0 ? filtered : EXPLORE_CATEGORY_WHITELIST;
    }

    // Global /search — hide lodging/service-only labels when possible
    return fromFacets.filter((name) => {
      const lower = String(name).toLowerCase();
      return !['luxurystay', 'luxury stay', 'services'].includes(lower);
    });
  }, [facetsData, storeKey]);

  // Drop out-of-mode filter params when entering a store
  useEffect(() => {
    if (!storeKey) return;
    const patch = {};
    if (storeKey === 'stays') {
      if (searchParams.get('category')) patch.category = null;
      // keep property/amenities
    } else {
      if (searchParams.get('propertyType')) patch.propertyType = null;
      if (searchParams.get('pool')) patch.pool = null;
      if (searchParams.get('garden')) patch.garden = null;
      if (searchParams.get('wifi')) patch.wifi = null;
      if (searchParams.get('jacuzzi')) patch.jacuzzi = null;
    }
    if (Object.keys(patch).length) updateParams(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when store changes
  }, [storeKey]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filtersFromUrl.q) params.set('q', filtersFromUrl.q);
    if (filtersFromUrl.city) params.set('city', filtersFromUrl.city);
    if (filtersFromUrl.categories.length) {
      params.set('categories', filtersFromUrl.categories.join(','));
      params.set('category', filtersFromUrl.categories[0]);
    }
    if (filtersFromUrl.productType) params.set('productType', filtersFromUrl.productType);
    if (filtersFromUrl.categoryGroup) params.set('categoryGroup', filtersFromUrl.categoryGroup);
    if (filtersFromUrl.propertyType) params.set('propertyType', filtersFromUrl.propertyType);
    if (filtersFromUrl.pool) params.set('pool', 'true');
    if (filtersFromUrl.garden) params.set('garden', 'true');
    if (filtersFromUrl.wifi) params.set('wifi', 'true');
    if (filtersFromUrl.jacuzzi) params.set('jacuzzi', 'true');
    if (filtersFromUrl.minPrice != null) params.set('minPrice', String(filtersFromUrl.minPrice));
    if (filtersFromUrl.maxPrice != null) params.set('maxPrice', String(filtersFromUrl.maxPrice));
    if (filtersFromUrl.minRating != null) params.set('minRating', String(filtersFromUrl.minRating));
    if (filtersFromUrl.skipTheLine) params.set('skipTheLine', 'true');
    if (filtersFromUrl.tags.length) params.set('tags', filtersFromUrl.tags.join(','));
    params.set('sortBy', filtersFromUrl.sortBy);
    params.set('page', String(filtersFromUrl.page));
    params.set('limit', '20');
    return params.toString();
  }, [filtersFromUrl]);

  const {
    data: searchResults,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['searchAdvanced', queryString],
    queryFn: async () => {
      const { data } = await api.get(`/api/search/advanced?${queryString}`);
      return data;
    },
    staleTime: 60 * 1000,
  });

  const products = Array.isArray(searchResults?.products) ? searchResults.products : [];
  const total = searchResults?.total ?? searchResults?.pagination?.total ?? products.length;
  const totalPages =
    searchResults?.totalPages ?? searchResults?.pagination?.totalPages ?? 1;

  useEffect(() => {
    if (products.length >= 0 && (filtersFromUrl.q || filtersFromUrl.city || filtersFromUrl.categories.length)) {
      trackSearch(
        filtersFromUrl.q || '',
        {
          city: filtersFromUrl.city,
          category: filtersFromUrl.categories.join(','),
          minPrice: filtersFromUrl.minPrice,
          maxPrice: filtersFromUrl.maxPrice,
          tags: filtersFromUrl.tags.join(','),
          productType: filtersFromUrl.productType,
        },
        total
      );
    }
  }, [searchResults]);

  const advancedFilters = {
    minPrice: filtersFromUrl.minPrice,
    maxPrice: filtersFromUrl.maxPrice,
    minRating: filtersFromUrl.minRating,
    skipTheLine: filtersFromUrl.skipTheLine,
    tags: filtersFromUrl.tags,
    propertyType: filtersFromUrl.propertyType || null,
    pool: filtersFromUrl.pool,
    garden: filtersFromUrl.garden,
    wifi: filtersFromUrl.wifi,
    jacuzzi: filtersFromUrl.jacuzzi,
    durations: [],
    selectedDate: null,
    location: null,
    locationName: '',
    radius: null,
  };

  const handleResetFilters = () => {
    if (lockedProductType) {
      setSearchParams({ productType: lockedProductType }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const setSearchQuery = (q) => updateParams({ q });
  const setSelectedCategories = (updater) => {
    const next =
      typeof updater === 'function' ? updater(filtersFromUrl.categories) : updater;
    updateParams({ category: next });
  };
  const setAdvancedFilters = (updater) => {
    const next = typeof updater === 'function' ? updater(advancedFilters) : updater;
    updateParams({
      minPrice: next.minPrice,
      maxPrice: next.maxPrice,
      minRating: next.minRating,
      skipTheLine: next.skipTheLine || null,
      tags: next.tags || [],
      propertyType: next.propertyType || null,
      pool: next.pool || null,
      garden: next.garden || null,
      wifi: next.wifi || null,
      jacuzzi: next.jacuzzi || null,
    });
  };

  const pageTitle = store
    ? t(store.titleKey)
    : t('catalog.title');
  const pageSubtitle = store ? t(store.subtitleKey) : null;

  const activeChips = [];
  if (filtersFromUrl.q) activeChips.push({ key: 'q', label: filtersFromUrl.q });
  if (filtersFromUrl.city) activeChips.push({ key: 'city', label: filtersFromUrl.city });
  if (filtersFromUrl.productType === 'luxury_stay' && !lockedProductType) {
    activeChips.push({ key: 'productType', label: t('header.luxury'), productType: 'luxury_stay' });
  }
  if (filtersFromUrl.productType === 'service' && !lockedProductType) {
    activeChips.push({ key: 'productType', label: t('header.extras'), productType: 'service' });
  }
  if (filtersFromUrl.propertyType) {
    activeChips.push({
      key: 'propertyType',
      label: t(`stores.stays.type_${filtersFromUrl.propertyType}`, filtersFromUrl.propertyType),
    });
  }
  ['pool', 'garden', 'wifi', 'jacuzzi'].forEach((am) => {
    if (filtersFromUrl[am]) {
      activeChips.push({ key: am, label: t(`stores.stays.amenity_${am}`) });
    }
  });
  filtersFromUrl.categories.forEach((c) =>
    activeChips.push({ key: `cat-${c}`, label: c, category: c })
  );
  filtersFromUrl.tags.forEach((tag) => {
    const tagKeyMap = {
      'annulation-gratuite': 'filters.tag_free_cancel',
      'confirmation-immediate': 'filters.tag_instant',
      bestseller: 'filters.tag_bestseller',
    };
    activeChips.push({
      key: `tag-${tag}`,
      label: t(tagKeyMap[tag] || tag, tag),
      tag,
    });
  });
  if (filtersFromUrl.minPrice != null || filtersFromUrl.maxPrice != null) {
    activeChips.push({
      key: 'price',
      label: `${filtersFromUrl.minPrice ?? '…'} – ${filtersFromUrl.maxPrice ?? '…'} MAD`,
    });
  }
  if (filtersFromUrl.minRating) {
    activeChips.push({ key: 'rating', label: `${filtersFromUrl.minRating}+ ★` });
  }

  const removeChip = (chip) => {
    if (chip.key === 'q') updateParams({ q: '' });
    else if (chip.key === 'city') updateParams({ city: '' });
    else if (chip.key === 'productType' && !lockedProductType) updateParams({ productType: null });
    else if (chip.key === 'propertyType') updateParams({ propertyType: null });
    else if (['pool', 'garden', 'wifi', 'jacuzzi'].includes(chip.key)) {
      updateParams({ [chip.key]: null });
    } else if (chip.category) {
      setSelectedCategories((prev) => prev.filter((c) => c !== chip.category));
    } else if (chip.tag) {
      setAdvancedFilters((prev) => ({
        ...prev,
        tags: (prev.tags || []).filter((t) => t !== chip.tag),
      }));
    } else if (chip.key === 'price') {
      updateParams({ minPrice: null, maxPrice: null });
    } else if (chip.key === 'rating') {
      updateParams({ minRating: null });
    }
  };

  const showCuratedExtras = storeKey === 'extras' && !isLoading && !isError && products.length === 0;
  const showCuratedStays = storeKey === 'stays' && !isLoading && !isError && products.length === 0;

  const filterSidebarProps = {
    searchQuery: filtersFromUrl.q,
    setSearchQuery,
    filters: advancedFilters,
    setFilters: setAdvancedFilters,
    categories,
    selectedCategories: filtersFromUrl.categories,
    setSelectedCategories,
    cities,
    selectedCity: filtersFromUrl.city,
    setSelectedCity: (city) => updateParams({ city }),
    onReset: handleResetFilters,
    storeMode: storeKey,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{pageTitle} | Overglow</title>
      </Helmet>

      <div className="container mx-auto px-4 pt-24 pb-8">
        {store && (
          <div className="mb-8 rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 text-white p-6 md:p-10">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200 mb-2">
              Overglow Trip
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">{pageTitle}</h1>
            {pageSubtitle && (
              <p className="text-emerald-50/90 max-w-2xl text-base md:text-lg">{pageSubtitle}</p>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto">
            <FilterSidebar {...filterSidebarProps} />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                {!store && (
                  <h1 className="text-2xl md:text-3xl font-heading font-bold text-slate-900">
                    {pageTitle}
                  </h1>
                )}
                <p className="text-slate-600 mt-1">
                  {total === 1
                    ? `1 ${t('catalog.result_found')}`
                    : `${total} ${t('catalog.results_found')}`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium"
                  onClick={() => setIsMobileDrawerOpen(true)}
                >
                  <SlidersHorizontal size={18} />
                  {t('catalog.open_filters')}
                </button>

                <label className="text-sm text-slate-600 flex items-center gap-2">
                  <span className="hidden sm:inline">{t('catalog.sort_by')}</span>
                  <select
                    value={filtersFromUrl.sortBy}
                    onChange={(e) => updateParams({ sortBy: e.target.value })}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="recommended">{t('catalog.sort_recommended')}</option>
                    <option value="price-low">{t('catalog.sort_price_low')}</option>
                    <option value="price-high">{t('catalog.sort_price_high')}</option>
                    <option value="rating">{t('catalog.sort_rating')}</option>
                    <option value="popularity">{t('catalog.sort_popularity')}</option>
                  </select>
                </label>
              </div>
            </div>

            {activeChips.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-xs uppercase tracking-wider text-slate-500 self-center me-1">
                  {t('catalog.active_filters')}
                </span>
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => removeChip(chip)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-sm text-slate-700 hover:border-primary-400"
                  >
                    {chip.label}
                    <X size={14} />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-sm text-primary-600 font-medium hover:underline"
                >
                  {t('filters.clear_all')}
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="py-20 text-center text-slate-500">{t('common.loading')}</div>
            ) : isError ? (
              <div className="py-20 text-center">
                <p className="text-slate-700 mb-4">{t('catalog.load_error')}</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold"
                >
                  {t('common.retry')}
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="space-y-8">
                <div className="py-12 text-center bg-white rounded-2xl border border-slate-100">
                  <p className="text-lg font-semibold text-slate-900 mb-2">{t('catalog.no_results')}</p>
                  <p className="text-slate-600 mb-6">{t('catalog.no_results_hint')}</p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-semibold"
                  >
                    {t('filters.clear_all')}
                  </button>
                </div>

                {showCuratedExtras && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="text-amber-500" size={20} />
                      <h2 className="text-xl font-heading font-bold text-slate-900">
                        {t('stores.extras.curated_title')}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {CURATED_EXTRAS.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {item.category}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                item.badge === 'soon'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {item.badge === 'soon'
                                ? t('stores.badge_soon')
                                : t('stores.badge_available')}
                            </span>
                          </div>
                          <h3 className="font-semibold text-slate-900">{item.title}</h3>
                          <p className="text-xs text-slate-500">{item.city}</p>
                          <p className="text-sm text-slate-600 flex-1">{item.description}</p>
                          <p className="text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                            {t('common.from')} {item.priceFrom} MAD
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showCuratedStays && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="text-amber-500" size={20} />
                      <h2 className="text-xl font-heading font-bold text-slate-900">
                        {t('stores.stays.curated_title')}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {CURATED_STAYS_TEASERS.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-2xl border border-slate-200 p-5"
                        >
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                            {t('stores.badge_soon')}
                          </span>
                          <h3 className="font-semibold text-slate-900 mt-3">{item.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">{item.city}</p>
                          <p className="text-sm text-slate-600 mt-2">{item.description}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-sm text-slate-600">
                      {t('stores.stays.meanwhile')}{' '}
                      <Link to="/explore" className="text-primary-600 font-semibold hover:underline">
                        {t('stores.explore.title')}
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {storeKey === 'extras' && (
                  <div className="mt-12">
                    <h2 className="text-lg font-heading font-bold text-slate-900 mb-4">
                      {t('stores.extras.also_coming')}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      {CURATED_EXTRAS.filter((i) => i.badge === 'soon')
                        .slice(0, 4)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="bg-white/80 rounded-xl border border-dashed border-slate-200 p-4"
                          >
                            <span className="text-[10px] font-bold uppercase text-amber-700">
                              {t('stores.badge_soon')}
                            </span>
                            <p className="font-medium text-slate-800 mt-1">{item.title}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .slice(
                        Math.max(0, filtersFromUrl.page - 3),
                        Math.min(totalPages, filtersFromUrl.page + 2)
                      )
                      .map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => updateParams({ page: p }, { resetPage: false })}
                          className={`w-10 h-10 rounded-xl text-sm font-semibold ${
                            p === filtersFromUrl.page
                              ? 'bg-primary-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-700'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <FilterDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        {...filterSidebarProps}
      />
    </div>
  );
};

export default SearchPage;
