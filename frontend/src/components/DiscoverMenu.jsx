import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Compass, Palmtree, Tent, Camera, Utensils, Ticket, Map as MapIcon, Star } from 'lucide-react';
import api from '../config/axios';
import { getCategoryName } from '../utils/categoryMapping';
import trendingDestinations from '../config/destinations';

const getCategoryLucideIcon = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('surf') || lowerName.includes('water') || lowerName.includes('beach')) return <Palmtree size={18} className="text-cyan-500" />;
  if (lowerName.includes('tour') || lowerName.includes('trip') || lowerName.includes('guid')) return <MapIcon size={18} className="text-emerald-500" />;
  if (lowerName.includes('food') || lowerName.includes('drink') || lowerName.includes('cuisine')) return <Utensils size={18} className="text-orange-500" />;
  if (lowerName.includes('show') || lowerName.includes('performance')) return <Ticket size={18} className="text-purple-500" />;
  if (lowerName.includes('outdoor') || lowerName.includes('nature') || lowerName.includes('mountain') || lowerName.includes('atlas')) return <Tent size={18} className="text-green-600" />;
  if (lowerName.includes('attraction') || lowerName.includes('sight') || lowerName.includes('city')) return <Camera size={18} className="text-rose-500" />;
  return <Compass size={18} className="text-primary-500" />;
};

const DiscoverMenu = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [destinations, setDestinations] = useState({ byRegion: {} });
  const [popularActivities, setPopularActivities] = useState([]);
  const menuRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Note: Click outside handling is done in parent component (Header.jsx)

  const fetchData = async () => {
    try {
      const [categoriesRes, destinationsRes] = await Promise.all([
        api.get('/api/search/categories'),
        api.get('/api/search/destinations')
      ]);
      
      setCategories(categoriesRes.data.categories || []);
      setPopularActivities(categoriesRes.data.popularActivities || []);
      setDestinations(destinationsRes.data);
    } catch (error) {
      console.error('Failed to fetch discover data:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={menuRef}
      className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-[70] w-[1000px] max-h-[600px] overflow-y-auto animate-in fade-in slide-in-from-top-2"
    >
      <div className="grid grid-cols-4 gap-6">
        {/* Top Categories */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Compass size={14} />
            Catégories
          </h3>
          <div className="space-y-1">
            {categories.slice(0, 6).map((category) => {
              const categorySlug = category.slug || category;
              const categoryName = category.name || getCategoryName(categorySlug);
              
              return (
                <Link
                  key={categorySlug}
                  to={`/search?category=${encodeURIComponent(categoryName)}`}
                  onClick={onClose}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                      {getCategoryLucideIcon(categoryName)}
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-primary-600">
                      {categoryName}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Popular Activities */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Star size={14} />
            Activités Populaires
          </h3>
          <div className="space-y-1">
            {popularActivities.slice(0, 8).map((activity, index) => (
              <Link
                key={index}
                to={`/search?q=${encodeURIComponent(activity)}`}
                onClick={onClose}
                className="block px-3 py-2.5 rounded-xl hover:bg-gray-50 transition text-sm text-slate-700 hover:text-primary-600 font-medium group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-primary-400 transition-colors"></span>
                  {activity}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Destinations */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MapPin size={14} />
            Top Destinations
          </h3>
          <div className="space-y-4">
            {Object.entries(destinations.byRegion).slice(0, 3).map(([region, cities]) => (
              <div key={region}>
                <div className="text-xs font-bold text-slate-500 mb-2 uppercase">{region}</div>
                <div className="space-y-1">
                  {cities.slice(0, 3).map((dest) => (
                    <Link
                      key={dest.city}
                      to={`/search?city=${encodeURIComponent(dest.city)}`}
                      onClick={onClose}
                      className="flex items-center px-3 py-2 rounded-xl hover:bg-gray-50 transition text-sm text-slate-700 hover:text-primary-600 font-medium"
                    >
                      {dest.city}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Destinations with Thumbnails */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Camera size={14} />
            Tendances
          </h3>
          <div className="space-y-3">
            {trendingDestinations.map((dest, idx) => (
              <Link
                key={idx}
                to={`/search?city=${encodeURIComponent(dest.name)}`}
                onClick={onClose}
                className="group relative block h-24 rounded-xl overflow-hidden shadow-sm"
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url('${dest.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 group-hover:from-black/80 transition-colors" />
                <div className="absolute bottom-3 left-3 text-white">
                  <div className="font-bold text-sm tracking-wide">{dest.name}</div>
                  <div className="text-[10px] text-slate-200 flex items-center gap-1">
                    Découvrir <ChevronRight size={10} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* View All Link */}
      <div className="mt-8 pt-4 border-t border-slate-100">
        <Link
          to="/search"
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors px-3 py-2 rounded-lg hover:bg-primary-50"
        >
          Explorer toutes les expériences
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default DiscoverMenu;
