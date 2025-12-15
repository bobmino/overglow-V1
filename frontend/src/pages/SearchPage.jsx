import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../config/axios';
import ProductCard from '../components/ProductCard';
import AdvancedFilters from '../components/AdvancedFilters';
import SearchSuggestions from '../components/SearchSuggestions';
import { Filter, X, Search, Heart, MapPin } from 'lucide-react';

const SearchPage = () => {
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
    skipTheLine: false
  });
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const searchInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState(['Marrakech', 'Casablanca', 'Fès', 'Rabat', 'Tanger', 'Agadir', 'Meknès', 'Ouarzazate']);
  
  // Fetch categories and cities from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          api.get('/api/search/categories'),
          api.get('/api/products')
        ]);
        
        // Extract categories from API response
        if (categoriesRes.data && Array.isArray(categoriesRes.data.categories)) {
          const categoryNames = categoriesRes.data.categories.map(cat => 
            typeof cat === 'string' ? cat : (cat.name || cat.slug)
          );
          setCategories(categoryNames);
        }
        
        // Extract unique cities from products
        const productsData = Array.isArray(productsRes.data) 
          ? productsRes.data 
          : (productsRes.data?.products || []);
        if (Array.isArray(productsData)) {
          const uniqueCities = [...new Set(productsData.map(p => p.city).filter(Boolean))];
          if (uniqueCities.length > 0) {
            setCities(prev => [...new Set([...prev, ...uniqueCities])]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        // Fallback to default categories if API fails
        setCategories(['Tours', 'Attractions', 'Food & Drink', 'Day Trips', 'Outdoor Activities', 'Shows & Performances', 'Activities']);
      }
    };
    fetchData();
  }, []);

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedSearches');
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved searches:', e);
      }
    }
  }, []);

  // Get search query from URL params
  useEffect(() => {
    const cityParam = searchParams.get('city');
    const queryParam = searchParams.get('q');
    const categoryParam = searchParams.get('category');
    
    if (cityParam) setSelectedCity(cityParam);
    if (queryParam) setSearchQuery(queryParam);
    
    // Handle category from URL (convert slug to display name)
    if (categoryParam) {
      // Import category mapping utility
      import('../utils/categoryMapping.js').then(({ normalizeCategory }) => {
        const normalizedCategory = normalizeCategory(categoryParam);
        if (normalizedCategory && !selectedCategories.includes(normalizedCategory)) {
          setSelectedCategories([normalizedCategory]);
        }
      });
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Use advanced search if filters are active
        const hasAdvancedFilters = 
          advancedFilters.minPrice || 
          advancedFilters.maxPrice || 
          advancedFilters.minRating ||
          (advancedFilters.durations && advancedFilters.durations.length > 0) ||
          advancedFilters.selectedDate ||
          advancedFilters.location ||
          advancedFilters.skipTheLine ||
          searchQuery;

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
          params.append('sortBy', sortBy);
          params.append('page', page);
          params.append('limit', 20);

          const { data } = await api.get(`/api/search/advanced?${params.toString()}`);
          const productsArray = Array.isArray(data.products) ? data.products : [];
          setProducts(productsArray);
          setFilteredProducts(productsArray);
          setTotalPages(data.totalPages || 1);
        } else {
          // Use simple product list
          const params = new URLSearchParams();
          if (selectedCity) params.append('city', selectedCity);
          const { data } = await api.get(`/api/products?${params.toString()}`);
          // Handle both old format (array) and new format (object with pagination)
          const productsArray = Array.isArray(data) ? data : (data?.products || []);
          const pagination = data?.pagination || { page: 1, totalPages: 1, total: productsArray.length };
          setProducts(productsArray);
          setFilteredProducts(productsArray);
          setPage(pagination.page || 1);
          setTotalPages(pagination.totalPages || 1);
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to load products:', err);
        setError('Failed to load products');
        setProducts([]);
        setFilteredProducts([]);
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCity, selectedCategories, advancedFilters, searchQuery, sortBy, page]);

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
      filtered = filtered.filter(p => selectedCategories.includes(p.category));
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

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

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
      skipTheLine: false
    });
    setPage(1);
    setSearchParams({});
  };

  const handleSaveSearch = () => {
    const searchConfig = {
      id: Date.now(),
      name: searchQuery || selectedCity || 'Recherche sauvegardée',
      query: searchQuery,
      city: selectedCity,
      categories: selectedCategories,
      filters: advancedFilters,
      sortBy,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedSearches, searchConfig];
    setSavedSearches(updated);
    localStorage.setItem('savedSearches', JSON.stringify(updated));
    alert('Recherche sauvegardée !');
  };

  const handleLoadSavedSearch = (savedSearch) => {
    setSearchQuery(savedSearch.query || '');
    setSelectedCity(savedSearch.city || '');
    setSelectedCategories(savedSearch.categories || []);
    setAdvancedFilters(savedSearch.filters || advancedFilters);
    setSortBy(savedSearch.sortBy || 'recommended');
    setPage(1);
    setShowSavedSearches(false);
  };

  const handleDeleteSavedSearch = (id) => {
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('savedSearches', JSON.stringify(updated));
  };

  const activeFiltersCount = (Array.isArray(selectedCategories) ? selectedCategories.length : 0) + (selectedCity ? 1 : 0) + (priceRange.min || priceRange.max ? 1 : 0);

  const searchTitle = searchQuery || selectedCity || selectedCategories.length > 0 
    ? `Recherche: ${searchQuery || selectedCity || selectedCategories.join(', ')} | Overglow Trip`
    : 'Rechercher des expériences au Maroc | Overglow Trip';

  return (
    <div className="container mx-auto px-4 py-8 pt-20 md:pt-24">
      <Helmet>
        <title>{searchTitle}</title>
        <meta name="description" content="Recherchez et découvrez les meilleures expériences authentiques au Maroc" />
        <meta property="og:title" content={searchTitle} />
        <meta property="og:description" content="Recherchez et découvrez les meilleures expériences authentiques au Maroc" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={20} />
            <input
              ref={searchInputRef}
              type="text"
              id="search-query"
              name="search-query"
              placeholder="Rechercher des expériences, destinations..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                // Delay hiding suggestions to allow clicks
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              aria-label="Rechercher des expériences, destinations"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
            />
            {showSuggestions && (
              <SearchSuggestions
                searchQuery={searchQuery}
                onSelect={(suggestion) => {
                  setSearchQuery(suggestion);
                  setShowSuggestions(false);
                  searchInputRef.current?.blur();
                }}
                onClear={() => {
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}
                showSuggestions={showSuggestions}
              />
            )}
          </div>
          <button
            onClick={handleSaveSearch}
            className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
            title="Sauvegarder cette recherche"
          >
            <Heart size={20} />
            <span className="hidden md:inline">Sauvegarder</span>
          </button>
          {savedSearches.length > 0 && (
            <button
              onClick={() => setShowSavedSearches(!showSavedSearches)}
              className="px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center space-x-2"
            >
              <span className="hidden md:inline">Recherches ({savedSearches.length})</span>
              <span className="md:hidden">{savedSearches.length}</span>
            </button>
          )}
        </div>

        {/* Saved Searches Dropdown */}
        {showSavedSearches && savedSearches.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-4 mb-4">
            <h3 className="font-semibold mb-3">Recherches sauvegardées</h3>
            <div className="space-y-2">
              {savedSearches.map((saved) => (
                <div key={saved.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                  <button
                    onClick={() => handleLoadSavedSearch(saved)}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium">{saved.name}</div>
                    <div className="text-sm text-slate-500">
                      {saved.query && `${saved.query} `}
                      {saved.city && `${saved.city} `}
                      {new Date(saved.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </button>
                  <button
                    onClick={() => handleDeleteSavedSearch(saved.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-xl border border-slate-200 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg flex items-center">
                <Filter size={20} className="mr-2" /> Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </h2>
              <button 
                onClick={handleResetFilters}
                className="text-sm text-primary-600 hover:underline font-medium"
              >
                Reset
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-slate-900">Category</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Array.isArray(categories) && categories.map((cat) => {
                  const categoryName = typeof cat === 'object' ? (cat.name || cat.slug) : cat;
                  const categoryId = `category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`;
                  return (
                    <label key={categoryName} htmlFor={categoryId} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                      <input 
                        type="checkbox"
                        id={categoryId}
                        name={categoryId}
                        checked={Array.isArray(selectedCategories) && selectedCategories.includes(categoryName)}
                        onChange={() => handleCategoryToggle(categoryName)}
                        className="rounded text-primary-600 focus:ring-primary-500" 
                        aria-label={`Filtrer par catégorie ${categoryName}`}
                      />
                      <span className="text-slate-700 text-sm">{categoryName}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* City Filter */}
            <div className="mb-6">
              <label htmlFor="city-filter" className="font-semibold mb-3 text-slate-900 block">Destination</label>
              <select
                id="city-filter"
                name="city-filter"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                aria-label="Filtrer par destination"
              >
                <option value="">All Cities</option>
                {Array.isArray(cities) && cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div className="mb-6">
              <label className="font-semibold mb-3 text-slate-900 block">Price Range (MAD)</label>
              <div className="flex items-center space-x-2">
                <label htmlFor="price-min" className="sr-only">Prix minimum</label>
                <input 
                  type="number"
                  id="price-min"
                  name="price-min"
                  placeholder="Min" 
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  aria-label="Prix minimum en dirhams marocains"
                  min="0"
                />
                <span className="text-slate-500" aria-hidden="true">-</span>
                <label htmlFor="price-max" className="sr-only">Prix maximum</label>
                <input 
                  type="number"
                  id="price-max"
                  name="price-max"
                  placeholder="Max" 
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  aria-label="Prix maximum en dirhams marocains"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Advanced Filters Component */}
          <div className="mt-6">
            <AdvancedFilters
              filters={advancedFilters}
              onFiltersChange={setAdvancedFilters}
              onReset={() => setAdvancedFilters({
                minPrice: null,
                maxPrice: null,
                minRating: null,
                durations: [],
                selectedDate: null,
                location: null,
                locationName: '',
                radius: null
              })}
              cities={cities}
              categories={categories}
            />
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1">
          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Array.isArray(selectedCategories) && selectedCategories.map(cat => (
                <span key={cat} className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                  {cat}
                  <button onClick={() => handleCategoryToggle(cat)} className="hover:bg-primary-200 rounded-full p-0.5">
                    <X size={14} />
                  </button>
                </span>
              ))}
              {selectedCity && (
                <span className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                  {selectedCity}
                  <button onClick={() => setSelectedCity('')} className="hover:bg-primary-200 rounded-full p-0.5">
                    <X size={14} />
                  </button>
                </span>
              )}
              {(priceRange.min || priceRange.max) && (
                <span className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                  €{priceRange.min || '0'} - €{priceRange.max || '∞'}
                  <button onClick={() => setPriceRange({ min: '', max: '' })} className="hover:bg-primary-200 rounded-full p-0.5">
                    <X size={14} />
                  </button>
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              {loading ? 'Searching...' : `${Array.isArray(filteredProducts) ? filteredProducts.length : 0} experiences found`}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <span className="font-medium">Sort by:</span>
              <label htmlFor="sort-by" className="sr-only">Trier par</label>
              <select 
                id="sort-by"
                name="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border-none bg-transparent font-semibold text-slate-900 focus:ring-0 cursor-pointer"
                aria-label="Trier les résultats"
              >
                <option value="recommended">Recommandé</option>
                <option value="price-low">Prix: Croissant</option>
                <option value="price-high">Prix: Décroissant</option>
                <option value="rating">Note</option>
                <option value="popularity">Popularité</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-80 bg-slate-100 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          ) : !Array.isArray(filteredProducts) || filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg mb-4">No experiences found matching your filters</p>
              <button 
                onClick={handleResetFilters}
                className="text-primary-600 hover:underline font-medium"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product?._id || Math.random()} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Précédent
              </button>
              <span className="px-4 py-2 text-slate-700">
                Page {page} sur {totalPages}
              </span>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
