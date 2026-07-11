import React, { useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { X, SlidersHorizontal } from 'lucide-react';
import api from '../config/axios';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import FilterDrawer from '../components/FilterDrawer';
import { trackSearch } from '../utils/analytics';

/**
 * URL is the source of truth for catalogue filters.
 * All filtering happens server-side via /api/search/advanced.
 */
const SearchPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = React.useState(false);

  const filtersFromUrl = useMemo(() => {
    const tagsParam = searchParams.get('tags');
    return {
      q: searchParams.get('q') || '',
      city: searchParams.get('city') || '',
      category: searchParams.get('category') || '',
      categories: searchParams.get('category')
        ? searchParams.get('category').split(',').filter(Boolean)
        : [],
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null,
      minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : null,
      skipTheLine: searchParams.get('skipTheLine') === 'true',
      tags: tagsParam ? tagsParam.split(',').filter(Boolean) : [],
      sortBy: searchParams.get('sortBy') || 'recommended',
      page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
    };
  }, [searchParams]);

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
      if (resetPage) next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const { data: facetsData } = useQuery({
    queryKey: ['searchFacets'],
    queryFn: async () => {
      const { data } = await api.get('/api/search/facets');
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const cities = (facetsData?.cities || []).map((c) => c.name).filter(Boolean);
  const categories = (facetsData?.categories || []).map((c) => c.name).filter(Boolean);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filtersFromUrl.q) params.set('q', filtersFromUrl.q);
    if (filtersFromUrl.city) params.set('city', filtersFromUrl.city);
    if (filtersFromUrl.categories.length) {
      params.set('categories', filtersFromUrl.categories.join(','));
      params.set('category', filtersFromUrl.categories[0]);
    }
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
    durations: [],
    selectedDate: null,
    location: null,
    locationName: '',
    radius: null,
  };

  const handleResetFilters = () => {
    setSearchParams({}, { replace: true });
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
    });
  };

  const activeChips = [];
  if (filtersFromUrl.q) activeChips.push({ key: 'q', label: filtersFromUrl.q });
  if (filtersFromUrl.city) activeChips.push({ key: 'city', label: filtersFromUrl.city });
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
    else if (chip.category) {
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{t('catalog.title')} | Overglow</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <FilterSidebar
              searchQuery={filtersFromUrl.q}
              setSearchQuery={setSearchQuery}
              filters={advancedFilters}
              setFilters={setAdvancedFilters}
              categories={categories}
              selectedCategories={filtersFromUrl.categories}
              setSelectedCategories={setSelectedCategories}
              cities={cities}
              selectedCity={filtersFromUrl.city}
              setSelectedCity={(city) => updateParams({ city })}
              onReset={handleResetFilters}
            />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-slate-900">
                  {t('catalog.title')}
                </h1>
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
                <span className="text-xs uppercase tracking-wider text-slate-500 self-center mr-1">
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
              <div className="py-20 text-center bg-white rounded-2xl border border-slate-100">
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
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

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
        filters={advancedFilters}
        setFilters={setAdvancedFilters}
        categories={categories}
        selectedCategories={filtersFromUrl.categories}
        setSelectedCategories={setSelectedCategories}
        cities={cities}
        selectedCity={filtersFromUrl.city}
        setSelectedCity={(city) => updateParams({ city })}
        searchQuery={filtersFromUrl.q}
        setSearchQuery={setSearchQuery}
        onReset={handleResetFilters}
      />
    </div>
  );
};

export default SearchPage;
