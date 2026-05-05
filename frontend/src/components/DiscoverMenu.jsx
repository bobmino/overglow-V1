import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Compass, Palmtree, Tent, Camera, Utensils, Map as MapIcon, Star, Sparkles } from 'lucide-react';
import trendingDestinations from '../config/destinations';

const staticCategories = [
  { name: 'Surf & Plage', icon: Palmtree, color: 'text-cyan-500' },
  { name: 'Aventure & Nature', icon: Tent, color: 'text-green-600' },
  { name: 'Visites Guidées', icon: MapIcon, color: 'text-emerald-500' },
  { name: 'Gastronomie', icon: Utensils, color: 'text-orange-500' },
  { name: 'Culture & Médina', icon: Camera, color: 'text-rose-500' },
  { name: 'Détente & Bien-être', icon: Sparkles, color: 'text-purple-500' }
];

const popularActivitiesList = [
  "Surf Camp Taghazout",
  "Quad dans les dunes",
  "Visite d'Agadir Oufella",
  "Excursion Paradise Valley",
  "Cours de cuisine marocaine",
  "Balade à dos de chameau",
  "Croisière en bateau",
  "Spa & Hammam traditionnel"
];

const DiscoverMenu = ({ isOpen, onClose }) => {
  const menuRef = useRef(null);

  if (!isOpen) return null;

  return (
    <div 
      ref={menuRef}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 p-10 z-[100] w-[95vw] max-w-7xl animate-in fade-in slide-in-from-top-4 duration-300"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="grid grid-cols-4 gap-12">
        {/* Top Categories */}
        <div className="col-span-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Compass size={16} strokeWidth={1.5} />
            Catégories
          </h3>
          <div className="space-y-2">
            {staticCategories.map((category, idx) => {
              const Icon = category.icon;
              return (
                <Link
                  key={idx}
                  to={`/search?category=${encodeURIComponent(category.name)}`}
                  onClick={onClose}
                  className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-slate-50 transition-all duration-300 group"
                >
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                    <Icon size={20} className={category.color} strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-600 transition-colors">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Popular Activities */}
        <div className="col-span-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Star size={16} strokeWidth={1.5} />
            Incontournables
          </h3>
          <div className="space-y-3">
            {popularActivitiesList.map((activity, index) => (
              <Link
                key={index}
                to={`/search?q=${encodeURIComponent(activity)}`}
                onClick={onClose}
                className="block px-4 py-2 rounded-xl hover:bg-slate-50 transition-all duration-300 text-sm text-slate-600 hover:text-emerald-600 font-medium group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-emerald-400 transition-colors duration-300"></span>
                  {activity}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Trending Destinations with Thumbnails */}
        <div className="col-span-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <MapPin size={16} strokeWidth={1.5} />
            Destinations Phares
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {trendingDestinations.map((dest, idx) => (
              <Link
                key={idx}
                to={`/search?city=${encodeURIComponent(dest.name)}`}
                onClick={onClose}
                className={`group relative block rounded-2xl overflow-hidden shadow-sm ${idx === 0 ? 'col-span-2 h-48' : 'col-span-1 h-32'}`}
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url('${dest.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-colors duration-300" />
                <div className="absolute bottom-5 left-5 text-white">
                  <div className="font-bold text-lg tracking-wide mb-1">{dest.name}</div>
                  <div className="text-xs text-slate-200 flex items-center gap-1 font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                    Explorer la région <ChevronRight size={12} strokeWidth={2} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* View All Link */}
      <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
        <Link
          to="/search"
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40"
        >
          Voir toutes nos expériences
          <ChevronRight size={16} strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
};

export default DiscoverMenu;
