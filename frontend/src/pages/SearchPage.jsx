import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../config/axios';
import ProductCard from '../components/ProductCard';
import { Filter, X } from 'lucide-react';

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

  const categories = ['Tours', 'Attractions', 'Food & Drink', 'Day Trips', 'Outdoor Activities', 'Shows & Performances', 'Activities'];
  const cities = ['Paris', 'Rome', 'Barcelona', 'London', 'Dubai', 'New York'];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/api/products');
        const productsArray = Array.isArray(data) ? data : [];
        setProducts(productsArray);
        setFilteredProducts(productsArray);
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
  }, []);

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
    setSortBy('recommended');
    setSearchParams({});
  };

  const activeFiltersCount = selectedCategories.length + (selectedCity ? 1 : 0) + (priceRange.min || priceRange.max ? 1 : 0);

  return (
    <div className="container mx-auto px-4 py-8 pt-20 md:pt-24">
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
                {categories.map((cat) => (
                  <label key={cat} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input 
                      type="checkbox" 
                      checked={selectedCategories.includes(cat)}
                      onChange={() => handleCategoryToggle(cat)}
                      className="rounded text-primary-600 focus:ring-primary-500" 
                    />
                    <span className="text-slate-700 text-sm">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* City Filter */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-slate-900">Destination</h3>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-slate-900">Price Range (€)</h3>
              <div className="flex items-center space-x-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                />
                <span className="text-slate-500">-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1">
          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCategories.map(cat => (
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
              {loading ? 'Searching...' : `${filteredProducts.length} experiences found`}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <span className="font-medium">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border-none bg-transparent font-semibold text-slate-900 focus:ring-0 cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Rating</option>
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
          ) : filteredProducts.length === 0 ? (
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
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
