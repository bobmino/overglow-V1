import React, { useState, useEffect } from 'react';
import { Search, Filter as FilterIcon, X, Check, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const REASSURANCE_TAGS = [
  { id: 'annulation-gratuite', label: 'Annulation gratuite', color: 'bg-green-100 text-green-700' },
  { id: 'confirmation-immediate', label: 'Confirmation immédiate', color: 'bg-blue-100 text-blue-700' },
  { id: 'bestseller', label: 'Bestseller', color: 'bg-amber-100 text-amber-700' }
];

const FilterSidebar = ({
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  categories,
  selectedCategories,
  setSelectedCategories,
  onReset
}) => {
  const { t } = useTranslation();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice || '');
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice || '');

  // Debounce for search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== searchQuery) {
        setSearchQuery(localQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery, searchQuery]);

  // Debounce for prices
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        minPrice: localMinPrice ? Number(localMinPrice) : null,
        maxPrice: localMaxPrice ? Number(localMaxPrice) : null
      }));
    }, 500);
    return () => clearTimeout(timer);
  }, [localMinPrice, localMaxPrice, setFilters]);

  // Sync external resets
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setLocalMinPrice(filters.minPrice || '');
    setLocalMaxPrice(filters.maxPrice || '');
  }, [filters.minPrice, filters.maxPrice]);

  const handleCategoryToggle = (categoryName) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleTagToggle = (tagId) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(t => t !== tagId)
      : [...currentTags, tagId];
    
    setFilters(prev => ({ ...prev, tags: newTags }));
  };

  const activeFiltersCount = 
    (selectedCategories?.length || 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.tags?.length || 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-xl text-slate-900 flex items-center">
          <FilterIcon size={22} className="mr-2" />
          {t('catalog.filters', 'Filtres')}
          {activeFiltersCount > 0 && (
            <span className="ml-2 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </h2>
        {activeFiltersCount > 0 && (
          <button 
            onClick={() => {
              onReset();
              setLocalQuery('');
              setLocalMinPrice('');
              setLocalMaxPrice('');
            }}
            className="text-sm text-slate-500 hover:text-primary-600 font-medium transition-colors"
          >
            Effacer
          </button>
        )}
      </div>

      <div className="space-y-6 divide-y divide-slate-100">
        
        {/* Keyword Search */}
        <div className="pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher (ex: quad, dromadaire...)"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
            />
          </div>
        </div>

        {/* Highlights / Tags Reassurance */}
        <div className="pt-6">
          <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">Populaires</h3>
          <div className="space-y-2">
            {REASSURANCE_TAGS.map((tag) => {
              const isActive = filters.tags?.includes(tag.id);
              return (
                <label key={tag.id} className="flex items-center space-x-3 cursor-pointer group">
                  <div className={`flex items-center justify-center w-5 h-5 rounded border ${isActive ? 'bg-primary-600 border-primary-600' : 'border-slate-300 bg-white group-hover:border-primary-500'} transition-colors`}>
                    {isActive && <Check size={14} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={isActive || false}
                    onChange={() => handleTagToggle(tag.id)}
                    className="hidden"
                  />
                  <span className={`text-sm font-medium px-2 py-0.5 rounded-md ${tag.color}`}>
                    {tag.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        <div className="pt-6">
          <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">{t('catalog.category', 'Catégories')}</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
            {Array.isArray(categories) && categories.map((cat) => {
              const categoryName = typeof cat === 'object' ? (cat.name || cat.slug) : cat;
              const isActive = Array.isArray(selectedCategories) && selectedCategories.includes(categoryName);
              return (
                <label key={categoryName} className="flex items-center space-x-3 cursor-pointer group">
                  <div className={`flex items-center justify-center w-5 h-5 rounded border ${isActive ? 'bg-primary-600 border-primary-600' : 'border-slate-300 bg-white group-hover:border-primary-500'} transition-colors`}>
                    {isActive && <Check size={14} className="text-white" />}
                  </div>
                  <input 
                    type="checkbox"
                    checked={isActive}
                    onChange={() => handleCategoryToggle(categoryName)}
                    className="hidden" 
                  />
                  <span className="text-slate-700 text-sm group-hover:text-slate-900 transition-colors">
                    {categoryName}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Price Filter */}
        <div className="pt-6">
          <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">Prix (MAD)</h3>
          <div className="flex items-center space-x-3">
            <input 
              type="number"
              placeholder="Min" 
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500"
              min="0"
            />
            <span className="text-slate-400 font-medium">-</span>
            <input 
              type="number"
              placeholder="Max" 
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500"
              min="0"
            />
          </div>
        </div>

        {/* Rating Filter */}
        <div className="pt-6">
          <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">Note Minimum</h3>
          <div className="space-y-2">
            {[5, 4, 3].map((rating) => {
              const isActive = filters.minRating === rating;
              return (
                <label key={rating} className="flex items-center space-x-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="rating"
                    checked={isActive}
                    onChange={() => setFilters(prev => ({ ...prev, minRating: isActive ? null : rating }))}
                    onClick={() => {
                      // Allow toggling off radio button
                      if (isActive) {
                        setFilters(prev => ({ ...prev, minRating: null }));
                      }
                    }}
                    className="hidden"
                  />
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full border ${isActive ? 'border-4 border-primary-600' : 'border-slate-300 group-hover:border-primary-500'}`}></div>
                  <div className="flex items-center space-x-1">
                    {[...Array(rating)].map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-slate-600 text-sm ml-1">{rating === 5 ? '5.0' : `${rating}.0+`}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FilterSidebar;
