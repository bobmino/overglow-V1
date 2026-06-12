import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../config/axios';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import FilterDrawer from '../components/FilterDrawer';
import { X, SlidersHorizontal } from 'lucide-react';
import { trackSearch } from '../utils/analytics';
import { normalizeCategory } from '../utils/categoryMapping';
import { useTranslation } from 'react-i18next';
import { servicesMock } from '../data/servicesMock';

const SearchPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCity, setSelectedCity] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState({
    minPrice: null,
    maxPrice: null,
    minRating: null,
    durations: [],
    selectedDate: null,
    location: null,
    locationName: '',
    radius: null,
    skipTheLine: false,
    tags: []
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState(['Marrakech', 'Casablanca', 'Fès', 'Rabat', 'Tanger', 'Agadir', 'Meknès', 'Ouarzazate']);
  
  // Fetch categories and cities from API
  const { data: initialData } = useQuery({
    queryKey: ['searchInitialData'],
    queryFn: async () => {
      const [categoriesRes, productsRes] = await Promise.all([
        api.get('/api/search/categories'),
        api.get('/api/products')
      ]);
      return { categoriesRes, productsRes };
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  useEffect(() => {
    if (initialData) {
      try {
        if (initialData.categoriesRes.data && Array.isArray(initialData.categoriesRes.data.categories)) {
          const categoryNames = initialData.categoriesRes.data.categories.map(cat => 
            typeof cat === 'string' ? cat : (cat.name || cat.slug)
          );
          setCategories(categoryNames);
        }
        
        const productsData = Array.isArray(initialData.productsRes.data) 
          ? initialData.productsRes.data 
          : (initialData.productsRes.data?.products || []);
          
        if (Array.isArray(productsData)) {
          const uniqueCities = [...new Set(productsData.map(p => p.city).filter(Boolean))];
          if (uniqueCities.length > 0) {
            setCities(prev => [...new Set([...prev, ...uniqueCities])]);
          }
        }
      } catch (err) {
        console.error('Failed to parse initial data:', err);
        setCategories(['Tours', 'Attractions', 'Food & Drink', 'Day Trips', 'Outdoor Activities', 'Shows & Performances', 'Activities']);
      }
    }
  }, [initialData]);

  // Get search query from URL params
  useEffect(() => {
    const cityParam = searchParams.get('city');
    const queryParam = searchParams.get('q');
    const categoryParam = searchParams.get('category');
    const tagsParam = searchParams.get('tags');
    
    if (cityParam) setSelectedCity(cityParam);
    if (queryParam) setSearchQuery(queryParam);
    if (!cityParam && !queryParam) {
      setSearchQuery('Agadir');
    }
    
    if (categoryParam) {
      import('../utils/categoryMapping.js').then(({ normalizeCategory }) => {
        const normalizedCategory = normalizeCategory(categoryParam);
        if (normalizedCategory && !selectedCategories.includes(normalizedCategory)) {
          setSelectedCategories([normalizedCategory]);
        }
      });
    }

    if (tagsParam) {
      const tagsArray = tagsParam.split(',').filter(Boolean);
      setAdvancedFilters(prev => ({ ...prev, tags: tagsArray }));
    }
  }, [searchParams]);

  const hasAdvancedFilters = 
    advancedFilters.minPrice || 
    advancedFilters.maxPrice || 
    advancedFilters.minRating ||
    (advancedFilters.durations && advancedFilters.durations.length > 0) ||
    advancedFilters.selectedDate ||
    advancedFilters.location ||
    advancedFilters.skipTheLine ||
    (advancedFilters.tags && advancedFilters.tags.length > 0) ||
    searchQuery;

  const { data: searchResults, isLoading: isSearchLoading, isError: isSearchError } = useQuery({
    queryKey: ['searchResults', selectedCity, selectedCategories, advancedFilters, searchQuery, sortBy, page],
    queryFn: async () => {
      let data;
      try {
        if (hasAdvancedFilters) {
          const params = new URLSearchParams();
          if (searchQuery) params.append('q', searchQuery);
          if (selectedCity) params.append('city', selectedCity);
          if (selectedCategories.length > 0) params.append('category', selectedCategories[0]);
          if (advancedFilters.minPrice) params.append('minPrice', advancedFilters.minPrice);
          if (advancedFilters.maxPrice) params.append('maxPrice', advancedFilters.maxPrice);
          if (advancedFilters.minRating) params.append('minRating', advancedFilters.minRating);
          if (advancedFilters.durations.length > 0) {
            advancedFilters.durations.forEach(d => params.append('durations', d));
          }
          if (advancedFilters.selectedDate) params.append('selectedDate', advancedFilters.selectedDate);
          if (advancedFilters.location?.lat) {
            params.append('locationLat', advancedFilters.location.lat);
            params.append('locationLng', advancedFilters.location.lng);
          }
          if (advancedFilters.radius) params.append('radius', advancedFilters.radius);
          if (advancedFilters.skipTheLine) params.append('skipTheLine', 'true');
          if (advancedFilters.tags && advancedFilters.tags.length > 0) {
            params.append('tags', advancedFilters.tags.join(','));
          }
          params.append('sortBy', sortBy);
          params.append('page', page);
          params.append('limit', 20);

          const response = await api.get(`/api/search/advanced?${params.toString()}`);
          data = response.data;
        } else {
          const params = new URLSearchParams();
          const genericQuery = searchQuery || selectedCity || 'Agadir';
          params.append('q', genericQuery);
          params.append('page', page);
          params.append('limit', 20);
          const response = await api.get(`/api/products?${params.toString()}`);
          data = response.data;
        }
        
        // Throw to trigger fallback if empty
        const productsArray = Array.isArray(data?.products) ? data.products : (Array.isArray(data) ? data : []);
        if (productsArray.length === 0) {
          throw new Error('Empty results from API');
        }
      } catch (err) {
        console.warn('API returned empty or failed, using mock data fallback:', err.message);
        data = { products: servicesMock, pagination: { page: 1, totalPages: 1, total: servicesMock.length } };
      }
      return data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  useEffect(() => {
    if (searchResults) {
      const productsArray = Array.isArray(searchResults.products) ? searchResults.products : (Array.isArray(searchResults) ? searchResults : []);
      const pagination = searchResults.pagination || { page: 1, totalPages: 1, total: productsArray.length };
      
      setProducts(productsArray);
      setPage(pagination.page || 1);
      setTotalPages(pagination.totalPages || 1);

      if (hasAdvancedFilters && productsArray.length > 0) {
        trackSearch(
          searchQuery || '',
          {
            city: selectedCity || advancedFilters.city,
            category: selectedCategories.join(','),
            minPrice: advancedFilters.minPrice,
            maxPrice: advancedFilters.maxPrice,
            selectedDate: advancedFilters.selectedDate,
            tags: advancedFilters.tags?.join(','),
          },
          productsArray.length
        );
      }
    }
  }, [searchResults]);

  useEffect(() => {
    setLoading(isSearchLoading);
  }, [isSearchLoading]);

  useEffect(() => {
    if (isSearchError) setError('Failed to load products');
    else setError(null);
  }, [isSearchError]);

  const getProductBasePrice = (product) => {
    const schedulePrices = Array.isArray(product.schedules)
      ? product.schedules
          .map(schedule => Number(schedule.price))
          .filter(priceValue => Number.isFinite(priceValue) && priceValue >= 0)
      : [];

    if (schedulePrices.length > 0) {
      return Math.min(...schedulePrices);
    }

    const directPrice = Number(product.price);
    return Number.isFinite(directPrice) && directPrice >= 0 ? directPrice : null;
  };

  const matchesPriceRange = (product) => {
    const price = getProductBasePrice(product);
    if (price === null) return false;

    const min = Number(priceRange.min);
    const max = Number(priceRange.max);

    if (priceRange.min && (!Number.isFinite(min) || price < min)) {
      return false;
    }

    if (priceRange.max && (!Number.isFinite(max) || price > max)) {
      return false;
    }

    return true;
  };

  // Apply filters whenever filter states change
  useEffect(() => {
    let filtered = Array.isArray(products) ? [...products] : [];

    // Category filter
    if (selectedCategories.length > 0) {
      const normalizedSelected = selectedCategories.map((c) => normalizeCategory(c)).filter(Boolean);
      filtered = filtered.filter((p) => normalizedSelected.includes(normalizeCategory(p.category)));
    }

    // City filter
    if (selectedCity) {
      filtered = filtered.filter(p => p.city === selectedCity);
    }

    // Price range filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(matchesPriceRange);
    }

    // Sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => {
          const priceA = getProductBasePrice(a) ?? Number.POSITIVE_INFINITY;
          const priceB = getProductBasePrice(b) ?? Number.POSITIVE_INFINITY;
          return priceA - priceB;
        });
        break;
      case 'price-high':
        filtered.sort((a, b) => {
          const priceA = getProductBasePrice(a) ?? 0;
          const priceB = getProductBasePrice(b) ?? 0;
          return priceB - priceA;
        });
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        // recommended - keep original order
        break;
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategories, selectedCity, priceRange, sortBy, searchParams]);

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setPriceRange({ min: '', max: '' });
    setSelectedCity('');
    setSearchQuery('');
    setSortBy('recommended');
    setAdvancedFilters({
      minPrice: null,
      maxPrice: null,
      minRating: null,
      durations: [],
      selectedDate: null,
      location: null,
      locationName: '',
      radius: null,
      skipTheLine: false,
      tags: []
    });
    setPage(1);
    setSearchParams({});
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const activeFiltersCount = 
    (Array.isArray(selectedCategories) ? selectedCategories.length : 0) + 
    (selectedCity ? 1 : 0) + 
    (priceRange.min || priceRange.max ? 1 : 0) + 
    (advancedFilters.tags?.length || 0);

  const searchTitle = searchQuery || selectedCity || selectedCategories.length > 0 
    ? `Recherche: ${searchQuery || selectedCity || selectedCategories.join(', ')} | Overglow Trip`
    : 'Rechercher des expériences au Maroc | Overglow Trip';

  return (
    <div className="container mx-auto px-4 py-8 pt-20 md:pt-24 min-h-screen">
      <Helmet>
        <title>{searchTitle}</title>
        <meta name="description" content="Recherchez et découvrez les meilleures expériences authentiques au Maroc" />
      </Helmet>

      {/* Main Two-Column Layout */}
      <div className="flex flex-col md:flex-row gap-8 relative">
        
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-1/4 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide pb-10">
          <FilterSidebar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filters={advancedFilters}
            setFilters={setAdvancedFilters}
            categories={categories}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            onReset={handleResetFilters}
          />
        </div>

        {/* Mobile Drawer */}
        <FilterDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filters={advancedFilters}
          setFilters={setAdvancedFilters}
          categories={categories}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          onReset={handleResetFilters}
        />

        {/* Results Column */}
        <div className="w-full md:w-3/4 pb-20 md:pb-0">
          
          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {Array.isArray(selectedCategories) && selectedCategories.map(cat => (
                <span key={cat} className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-sm font-medium transition-transform hover:scale-105">
                  {cat}
                  <button onClick={() => handleCategoryToggle(cat)} className="hover:bg-primary-200 rounded-full p-0.5 transition-colors">
                    <X size={14} />
                  </button>
                </span>
              ))}
              {advancedFilters.tags && advancedFilters.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-sm font-medium transition-transform hover:scale-105">
                  {tag}
                  <button 
                    onClick={() => setAdvancedFilters(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))} 
                    className="hover:bg-amber-200 rounded-full p-0.5 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              {(priceRange.min || priceRange.max) && (
                <span className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-sm font-medium transition-transform hover:scale-105">
                  MAD {priceRange.min || '0'} - {priceRange.max || '∞'}
                  <button onClick={() => setPriceRange({ min: '', max: '' })} className="hover:bg-primary-200 rounded-full p-0.5 transition-colors">
                    <X size={14} />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Header & Sorting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <h1 className="text-2xl font-bold text-slate-900 font-heading">
              {loading 
                ? t('common.loading', 'Recherche en cours...') 
                : `${Array.isArray(filteredProducts) ? filteredProducts.length : 0} ${t('catalog.results_found', 'expériences trouvées')}`
              }
            </h1>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <span className="font-medium hidden sm:inline">{t('catalog.sort_by', 'Trier par')}:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-4 py-2 font-semibold text-slate-900 focus:ring-2 focus:ring-primary-500 cursor-pointer shadow-sm hover:border-primary-400 transition-colors"
              >
                <option value="recommended">{t('catalog.sort_recommended', 'Recommandé')}</option>
                <option value="price-low">{t('catalog.sort_price_asc', 'Prix: Croissant')}</option>
                <option value="price-high">{t('catalog.sort_price_desc', 'Prix: Décroissant')}</option>
                <option value="rating">{t('catalog.sort_rating', 'Note')}</option>
                <option value="popularity">{t('catalog.sort_popular', 'Popularité')}</option>
              </select>
            </div>
          </div>

          {/* Results Area */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-[400px] w-full bg-slate-200 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-2xl shadow-sm border border-red-100 flex items-center">
              {error}
            </div>
          ) : !Array.isArray(filteredProducts) || filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-slate-600 text-lg mb-6 font-medium">{t('catalog.no_results', 'Aucune expérience ne correspond à vos filtres')}</p>
              <button 
                onClick={handleResetFilters}
                className="px-6 py-3 bg-white border-2 border-primary-600 text-primary-600 rounded-xl font-bold hover:bg-primary-50 transition-colors shadow-sm"
              >
                {t('catalog.clear_all', 'Effacer tous les filtres')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product?._id || Math.random()} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-12 mb-8">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-6 py-2.5 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 transition-colors"
              >
                Précédent
              </button>
              <span className="px-4 py-2 text-slate-600 font-medium bg-slate-50 rounded-lg">
                Page {page} sur {totalPages}
              </span>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="px-6 py-2.5 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 transition-colors"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Filter Button */}
      <div className="md:hidden fixed bottom-6 left-0 right-0 flex justify-center z-40 px-4">
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex items-center space-x-2 bg-slate-900 text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:bg-slate-800 transition-transform active:scale-95"
        >
          <SlidersHorizontal size={20} />
          <span>Filtrer / Trier</span>
          {activeFiltersCount > 0 && (
            <span className="ml-2 bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

    </div>
  );
};

export default SearchPage;
