import React, { useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useSearchParams } from 'react-router-dom';
import LocalizedLink from '../components/LocalizedLink';
import { useTranslation } from 'react-i18next';
import { X, Sparkles } from 'lucide-react';
import api from '../config/axios';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import SEOHead from '../components/SEOHead';
import CatalogFilterBar from '../components/catalog/CatalogFilterBar';
import FilterModal from '../components/catalog/FilterModal';
import { trackSearch } from '../utils/analytics';
import {
  CURATED_EXTRAS,
  CURATED_STAYS_TEASERS,
  STORE_CONFIG,
  EXPLORE_CATEGORY_WHITELIST,
  EXTRAS_CATEGORY_VALUES,
  hasActiveStoreFilters,
  PROPERTY_TYPE_ORDER,
} from '../data/storeCatalog';
import { normalizeCategory } from '../utils/categoryMapping';
import StoreBrowseLayout from '../components/store/StoreBrowseLayout';

import { stripLangPrefix } from '../utils/i18nRouting';

const pathToStore = (pathname) => {
  const path = stripLangPrefix(pathname);
  if (path.startsWith('/explore')) return 'explore';
  if (path.startsWith('/stays')) return 'stays';
  if (path.startsWith('/extras')) return 'extras';
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
  const [isFilterModalOpen, setIsFilterModalOpen] = React.useState(false);

  const storeKey = pathToStore(location.pathname);
  const store = storeKey ? STORE_CONFIG[storeKey] : null;
  const lockedProductType = store?.productType || '';
  const filterProfile = store?.filterProfile || null;
  const browseMode = store?.browseMode || null;

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
    const taxonomyParam = searchParams.get('taxonomy') || '';
    const productTypeParam = lockedProductType || searchParams.get('productType') || '';
    return {
      q: searchParams.get('q') || '',
      city: searchParams.get('city') || '',
      category: categoryParam,
      categories: categoryParam ? categoryParam.split(',').filter(Boolean) : [],
      taxonomy: taxonomyParam ? taxonomyParam.split(',').filter(Boolean) : [],
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
      cancellationType: searchParams.get('cancellationType') || null,
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

  const taxonomyOptions = useMemo(() => {
    if (filterProfile === 'stay') return [];
    return Array.isArray(facetsData?.taxonomy) ? facetsData.taxonomy : [];
  }, [facetsData, filterProfile]);

  const categories = useMemo(() => {
    const fromFacets = (facetsData?.categories || []).map((c) => c.name).filter(Boolean);

    if (filterProfile === 'stay') return [];

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
  }, [facetsData, storeKey, filterProfile]);

  const isBrowseDefault = Boolean(storeKey && browseMode && !hasActiveStoreFilters(filtersFromUrl));

  // Drop out-of-mode filter params when entering a store
  useEffect(() => {
    if (!storeKey) return;
    const patch = {};
    if (filterProfile === 'stay') {
      if (searchParams.get('category')) patch.category = null;
      if (searchParams.get('taxonomy')) patch.taxonomy = null;
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
    if (filtersFromUrl.taxonomy.length) {
      params.set('taxonomy', filtersFromUrl.taxonomy.join(','));
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
    if (filtersFromUrl.cancellationType) {
      params.set('cancellationType', filtersFromUrl.cancellationType);
    }
    params.set('sortBy', filtersFromUrl.sortBy);
    params.set('page', String(isBrowseDefault ? 1 : filtersFromUrl.page));
    params.set('limit', isBrowseDefault ? '60' : '20');
    return params.toString();
  }, [filtersFromUrl, isBrowseDefault]);

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
    cancellationType: filtersFromUrl.cancellationType,
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
  const setSelectedTaxonomy = (updater) => {
    const next =
      typeof updater === 'function' ? updater(filtersFromUrl.taxonomy) : updater;
    updateParams({ taxonomy: next });
  };
  const setAdvancedFilters = (updater) => {
    const next = typeof updater === 'function' ? updater(advancedFilters) : updater;
    updateParams({
      minPrice: next.minPrice,
      maxPrice: next.maxPrice,
      minRating: next.minRating,
      skipTheLine: next.skipTheLine || null,
      tags: next.tags || [],
      cancellationType: next.cancellationType || null,
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
  filtersFromUrl.taxonomy.forEach((slug) => {
    const opt = taxonomyOptions.find((o) => o.slug === slug);
    activeChips.push({
      key: `tax-${slug}`,
      label: opt?.label || slug,
      taxonomy: slug,
    });
  });
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
  if (filtersFromUrl.cancellationType) {
    const cancelKeyMap = {
      free: 'filters.cancel_free',
      moderate: 'filters.cancel_moderate',
      strict: 'filters.cancel_strict',
      non_refundable: 'filters.cancel_non_refundable',
    };
    activeChips.push({
      key: 'cancellationType',
      label: t(cancelKeyMap[filtersFromUrl.cancellationType] || 'filters.cancellation_policy'),
    });
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
    } else if (chip.taxonomy) {
      setSelectedTaxonomy((prev) => prev.filter((s) => s !== chip.taxonomy));
    } else if (chip.tag) {
      setAdvancedFilters((prev) => ({
        ...prev,
        tags: (prev.tags || []).filter((t) => t !== chip.tag),
      }));
    } else if (chip.key === 'price') {
      updateParams({ minPrice: null, maxPrice: null });
    } else if (chip.key === 'rating') {
      updateParams({ minRating: null });
    } else if (chip.key === 'cancellationType') {
      updateParams({ cancellationType: null });
    }
  };

  const showCuratedExtras =
    storeKey === 'extras' && isBrowseDefault && !isLoading && !isError && products.length === 0;
  const showCuratedStays =
    storeKey === 'stays' && isBrowseDefault && !isLoading && !isError && products.length === 0;

  const handleSeeAllSection = useCallback(
    (payload) => {
      if (!payload) return;
      updateParams(payload);
    },
    [updateParams]
  );

  const filterPills = useMemo(() => {
    if (filterProfile === 'stay') {
      return PROPERTY_TYPE_ORDER.filter((id) => id !== 'other').map((id) => ({
        key: `prop-${id}`,
        kind: 'propertyType',
        value: id,
        label: t(`stores.stays.type_${id}`, id),
      }));
    }

    const parentLabels = [];
    const seen = new Set();
    (taxonomyOptions || []).forEach((opt) => {
      const parent = opt.parentLabel || opt.label;
      if (!parent || seen.has(parent)) return;
      seen.add(parent);
      const slugs = (taxonomyOptions || [])
        .filter((o) => (o.parentLabel || o.label) === parent)
        .map((o) => o.slug)
        .filter(Boolean);
      parentLabels.push({
        key: `tax-parent-${parent}`,
        kind: 'taxonomyParent',
        value: slugs,
        label: parent,
      });
    });

    if (parentLabels.length) {
      return [
        {
          key: 'tag-free-cancel',
          kind: 'tag',
          value: 'annulation-gratuite',
          label: t('filters.tag_free_cancel'),
        },
        ...parentLabels.slice(0, 10),
      ];
    }

    return (categories || []).slice(0, 10).map((name) => ({
      key: `cat-${name}`,
      kind: 'category',
      value: name,
      label: name,
    }));
  }, [filterProfile, taxonomyOptions, categories, t]);

  const activePillKeys = useMemo(() => {
    const keys = [];
    if (filtersFromUrl.tags.includes('annulation-gratuite')) keys.push('tag-free-cancel');
    if (filtersFromUrl.propertyType) keys.push(`prop-${filtersFromUrl.propertyType}`);
    filtersFromUrl.categories.forEach((c) => keys.push(`cat-${c}`));
    filterPills.forEach((pill) => {
      if (pill.kind === 'taxonomyParent' && Array.isArray(pill.value)) {
        const allSelected =
          pill.value.length > 0
          && pill.value.every((slug) => filtersFromUrl.taxonomy.includes(slug));
        if (allSelected) keys.push(pill.key);
      }
    });
    return keys;
  }, [filtersFromUrl, filterPills]);

  const handlePillToggle = useCallback(
    (pill) => {
      if (!pill) return;
      if (pill.kind === 'tag') {
        const has = filtersFromUrl.tags.includes(pill.value);
        updateParams({
          tags: has
            ? filtersFromUrl.tags.filter((x) => x !== pill.value)
            : [...filtersFromUrl.tags, pill.value],
        });
        return;
      }
      if (pill.kind === 'propertyType') {
        updateParams({
          propertyType: filtersFromUrl.propertyType === pill.value ? null : pill.value,
        });
        return;
      }
      if (pill.kind === 'category') {
        const has = filtersFromUrl.categories.includes(pill.value);
        updateParams({
          category: has
            ? filtersFromUrl.categories.filter((c) => c !== pill.value)
            : [...filtersFromUrl.categories, pill.value],
        });
        return;
      }
      if (pill.kind === 'taxonomyParent' && Array.isArray(pill.value)) {
        const allSelected =
          pill.value.length > 0
          && pill.value.every((slug) => filtersFromUrl.taxonomy.includes(slug));
        if (allSelected) {
          updateParams({
            taxonomy: filtersFromUrl.taxonomy.filter((s) => !pill.value.includes(s)),
          });
        } else {
          updateParams({
            taxonomy: [...new Set([...filtersFromUrl.taxonomy, ...pill.value])],
          });
        }
      }
    },
    [filtersFromUrl, updateParams]
  );

  const filterSidebarProps = {
    searchQuery: filtersFromUrl.q,
    setSearchQuery,
    filters: advancedFilters,
    setFilters: setAdvancedFilters,
    categories,
    selectedCategories: filtersFromUrl.categories,
    setSelectedCategories,
    taxonomyOptions,
    selectedTaxonomy: filtersFromUrl.taxonomy,
    setSelectedTaxonomy,
    cities,
    selectedCity: filtersFromUrl.city,
    setSelectedCity: (city) => updateParams({ city }),
    onReset: handleResetFilters,
    storeMode: storeKey,
    filterProfile,
  };

  const resultLabel = isBrowseDefault
    ? t('stores.browse_hint', 'Parcourir par catégorie')
    : total === 1
      ? `1 ${t('catalog.result_found')}`
      : `${total} ${t('catalog.results_found')}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <SEOHead
        title={pageTitle}
        description={pageSubtitle || t('catalog.meta_description', 'Explorez des expériences authentiques au Maroc.')}
        pathname={location.pathname}
      />

      <div className="container mx-auto px-4 pt-24 pb-8">
        {store && (
          <div className="mb-5 rounded-2xl bg-gradient-to-br from-primary-900 via-emerald-800 to-teal-700 text-white px-5 py-6 md:px-8 md:py-8">
            <p className="text-xs uppercase tracking-[0.2em] text-primary-200 mb-1.5">
              Overglow
            </p>
            <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">{pageTitle}</h1>
            {pageSubtitle && (
              <p className="text-primary-50/90 max-w-2xl text-sm md:text-base">{pageSubtitle}</p>
            )}
          </div>
        )}

        {!store && (
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-slate-900 mb-2">
            {pageTitle}
          </h1>
        )}

        <CatalogFilterBar
          resultLabel={resultLabel}
          onOpenFilters={() => setIsFilterModalOpen(true)}
          pills={filterPills}
          activePillKeys={activePillKeys}
          onPillToggle={handlePillToggle}
          cities={cities}
          selectedCity={filtersFromUrl.city}
          onCityChange={(city) => updateParams({ city })}
          sortBy={filtersFromUrl.sortBy}
          onSortChange={(sortBy) => updateParams({ sortBy })}
        />

        <div className="min-w-0">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-slate-100 bg-white animate-pulse">
                    <div className="aspect-[3/4] bg-slate-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-3 w-1/3 bg-slate-200 rounded" />
                      <div className="h-5 w-4/5 bg-slate-200 rounded" />
                      <div className="h-3 w-1/2 bg-slate-100 rounded" />
                      <div className="h-8 w-1/3 bg-slate-200 rounded mt-4" />
                    </div>
                  </div>
                ))}
              </div>
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
                <EmptyState
                  variant="search"
                  className="bg-white rounded-2xl border border-slate-100"
                  title={t('catalog.no_results')}
                  subtitle={t('catalog.no_results_hint')}
                  ctaLabel={t('filters.clear_all')}
                  onCta={handleResetFilters}
                />

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
                              {t(item.categoryKey)}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                item.badge === 'soon'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-primary-50 text-primary-700'
                              }`}
                            >
                              {item.badge === 'soon'
                                ? t('stores.badge_soon')
                                : t('stores.badge_available')}
                            </span>
                          </div>
                          <h3 className="font-semibold text-slate-900">{t(item.titleKey)}</h3>
                          <p className="text-xs text-slate-500">{t(item.cityKey)}</p>
                          <p className="text-sm text-slate-600 flex-1">{t(item.descriptionKey)}</p>
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
                          <h3 className="font-semibold text-slate-900 mt-3">{t(item.titleKey)}</h3>
                          <p className="text-xs text-slate-500 mt-1">{t(item.cityKey)}</p>
                          <p className="text-sm text-slate-600 mt-2">{t(item.descriptionKey)}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-sm text-slate-600">
                      {t('stores.stays.meanwhile')}{' '}
                      <LocalizedLink to="/explore" className="text-primary-600 font-semibold hover:underline">
                        {t('stores.explore.title')}
                      </LocalizedLink>
                    </p>
                  </div>
                )}
              </div>
            ) : isBrowseDefault ? (
              <StoreBrowseLayout
                products={products}
                browseMode={browseMode}
                taxonomyOptions={taxonomyOptions}
                storeKey={storeKey}
                onSeeAllSection={handleSeeAllSection}
              />
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
                            <p className="font-medium text-slate-800 mt-1">{t(item.titleKey)}</p>
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

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={() => setIsFilterModalOpen(false)}
        onReset={handleResetFilters}
        resultCount={total}
        {...filterSidebarProps}
      />
    </div>
  );
};

export default SearchPage;
