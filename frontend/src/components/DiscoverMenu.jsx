import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Compass } from 'lucide-react';
import api from '../config/axios';

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
      
      setCategories(Array.isArray(categoriesRes.data?.categories) ? categoriesRes.data.categories : []);
      setPopularActivities(Array.isArray(categoriesRes.data?.popularActivities) ? categoriesRes.data.popularActivities : []);
      setDestinations(destinationsRes.data?.byRegion ? destinationsRes.data : { byRegion: {} });
    } catch (error) {
      console.error('Failed to fetch discover data:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={menuRef}
      className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-[70] w-[800px] max-h-[600px] overflow-y-auto animate-in fade-in slide-in-from-top-2"
    >
      <div className="grid grid-cols-3 gap-6">
        {/* Top Categories */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Compass size={14} />
            Top Categories
          </h3>
          <div className="space-y-1">
            {Array.isArray(categories) && categories.slice(0, 6).map((category) => (
              <Link
                key={category.slug}
                to={`/search?category=${encodeURIComponent(category.slug)}&sort=rating&view=category&filter=active`}
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-primary-600">
                    {category.name}
                  </span>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-primary-600" />
              </Link>
            ))}
          </div>
        </div>

        {/* Popular Activities */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Popular Activities
          </h3>
          <div className="space-y-1">
            {Array.isArray(popularActivities) && popularActivities.slice(0, 8).map((activity, index) => (
              <Link
                key={index}
                to={`/search?q=${encodeURIComponent(activity)}&sort=price-low&view=activity&filter=popular`}
                onClick={onClose}
                className="block px-3 py-2 rounded-lg hover:bg-slate-50 transition text-sm text-slate-700 hover:text-primary-600 font-medium"
              >
                {activity}
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
          <div className="space-y-3">
            {destinations?.byRegion && typeof destinations.byRegion === 'object' && Object.entries(destinations.byRegion).slice(0, 3).map(([region, cities]) => (
              <div key={region}>
                <div className="text-xs font-bold text-slate-500 mb-1">{region}</div>
                <div className="space-y-1">
                  {Array.isArray(cities) && cities.slice(0, 3).map((dest) => (
                    <Link
                      key={dest.city}
                      to={`/search?city=${encodeURIComponent(dest.city)}&sort=recommended&view=destination&filter=top`}
                      onClick={onClose}
                      className="block px-3 py-1.5 rounded-lg hover:bg-slate-50 transition text-sm text-slate-700 hover:text-primary-600"
                    >
                      {dest.city}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* View All Link */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <Link
          to="/search"
          onClick={onClose}
          className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-2"
        >
          Explore all destinations
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default DiscoverMenu;
