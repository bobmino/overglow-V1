import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, MapPin, Compass, Palmtree, Tent, Camera, Utensils, 
  Map as MapIcon, Star, Sparkles, Home, Car, Navigation, Ship
} from 'lucide-react';

// Sub-categories list for left column
const staticCategories = [
  { name: 'Surf & Plage', icon: Palmtree, color: 'text-cyan-500' },
  { name: 'Aventure & Nature', icon: Tent, color: 'text-green-600' },
  { name: 'Visites Guidées', icon: MapIcon, color: 'text-emerald-500' },
  { name: 'Gastronomie', icon: Utensils, color: 'text-orange-500' },
  { name: 'Culture & Médina', icon: Camera, color: 'text-rose-500' },
  { name: 'Détente & Bien-être', icon: Sparkles, color: 'text-purple-500' }
];

// Mapping dictionary for incontournables (activities) and destinationsPhares (destinations)
const categoryDataMapping = {
  'Surf & Plage': {
    incontournables: [
      "Surf Camp Taghazout",
      "Sunset Yoga on the Beach",
      "Jet Ski Adventure Agadir",
      "Plage sauvage d'Imouran",
      "Balade en catamaran au coucher du soleil"
    ],
    destinationsPhares: [
      { name: 'Taghazout', image: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=800&q=80' },
      { name: 'Agadir', image: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=800&q=80' }
    ]
  },
  'Aventure & Nature': {
    incontournables: [
      "Excursion Paradise Valley",
      "Quad dans les dunes de sable",
      "Randonnée Atlas & Oasis",
      "Survol en Montgolfière Agadir",
      "Buggy Safari & Thé chez l'habitant"
    ],
    destinationsPhares: [
      { name: 'Paradise Valley', image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80' },
      { name: 'Imouzzer', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80' }
    ]
  },
  'Visites Guidées': {
    incontournables: [
      "Visite d'Agadir Oufella",
      "Découverte guidée du Souk El Had",
      "Journée guidée à Taroudant & Tiout",
      "Excursion historique Essaouira",
      "Marrakech Express en 1 jour"
    ],
    destinationsPhares: [
      { name: 'Essaouira', image: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=800&q=80' },
      { name: 'Taroudant', image: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=800&q=80' }
    ]
  },
  'Gastronomie': {
    incontournables: [
      "Cours de cuisine marocaine traditionnelle",
      "Dégustation d'Argan & Miel à Amalou",
      "Dîner spectacle sous tente Caïdale",
      "Street food tour dans la médina",
      "Parcours des thés et pâtisseries fines"
    ],
    destinationsPhares: [
      { name: 'Marrakech', image: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=800&q=80' },
      { name: 'Agadir', image: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=800&q=80' }
    ]
  },
  'Culture & Médina': {
    incontournables: [
      "Musée de la Culture Amazighe",
      "Médina de Coco Polizzi",
      "Palais de Taroudant et remparts",
      "Heritage tour & conteurs traditionnels",
      "Visite des ateliers coopératifs d'artisans"
    ],
    destinationsPhares: [
      { name: 'La Médina d\'Agadir', image: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=800&q=80' },
      { name: 'Taroudant', image: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=800&q=80' }
    ]
  },
  'Détente & Bien-être': {
    incontournables: [
      "Spa & Hammam traditionnel privatif",
      "Massage aux huiles essentielles d'Argan",
      "Retraite Yoga & Sound Healing",
      "Bain de boue & enveloppement d'argile",
      "Thalassothérapie face à l'océan"
    ],
    destinationsPhares: [
      { name: 'Taghazout Bay', image: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=800&q=80' },
      { name: 'Agadir Marina', image: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=800&q=80' }
    ]
  }
};

const DiscoverMenu = ({ isOpen, onClose, menuType = 'discover' }) => {
  const [activeCategory, setActiveCategory] = useState('Surf & Plage');

  if (!isOpen) return null;

  // Custom views for luxury stay & service extras
  if (menuType === 'luxury') {
    return (
      <div 
        className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 p-10 z-[100] w-[95vw] max-w-7xl animate-in fade-in slide-in-from-top-4 duration-300"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="grid grid-cols-3 gap-12">
          {/* Luxury Categories */}
          <div className="col-span-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Home size={16} strokeWidth={1.5} className="text-emerald-600" />
              Types de Logement
            </h3>
            <div className="space-y-2">
              {[
                { name: 'Villas de Prestige', desc: 'Villas avec piscine privée et vue mer' },
                { name: 'Appartements Vue Océan', desc: 'Duplex et appartements standing Marina' },
                { name: 'Riads Insolites', desc: 'Riads authentiques au coeur des oasis' }
              ].map((item, idx) => (
                <Link
                  key={idx}
                  to={`/search?category=${encodeURIComponent(item.name)}`}
                  onClick={onClose}
                  className="block p-4 rounded-2xl hover:bg-slate-50 transition-all duration-300 group"
                >
                  <span className="block text-sm font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">
                    {item.name}
                  </span>
                  <span className="block text-xs text-slate-400 mt-1">{item.desc}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Key services & details */}
          <div className="col-span-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Star size={16} strokeWidth={1.5} className="text-emerald-600" />
              Services Inclus
            </h3>
            <div className="space-y-4 text-sm text-slate-600 font-medium">
              <div className="flex items-center gap-3 px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Conciergerie privée 24/7
              </div>
              <div className="flex items-center gap-3 px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Chef à domicile sur demande
              </div>
              <div className="flex items-center gap-3 px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Entretien quotidien et gouvernante
              </div>
              <div className="flex items-center gap-3 px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Transferts aéroport VIP offerts
              </div>
            </div>
          </div>

          {/* Premium banner destinations */}
          <div className="col-span-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <MapPin size={16} strokeWidth={1.5} className="text-emerald-600" />
              Destinations Rares
            </h3>
            <div className="relative h-48 rounded-2xl overflow-hidden shadow-sm group cursor-pointer">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=800&q=80')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-5 text-white">
                <div className="font-bold text-lg">Taghazout Bay Heights</div>
                <div className="text-xs text-slate-200 mt-1 flex items-center gap-1 font-medium">
                  Explorer les propriétés <ChevronRight size={12} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (menuType === 'services') {
    return (
      <div 
        className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 p-10 z-[100] w-[95vw] max-w-7xl animate-in fade-in slide-in-from-top-4 duration-300"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="grid grid-cols-3 gap-12">
          {/* Services Category List */}
          <div className="col-span-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Car size={16} strokeWidth={1.5} className="text-emerald-600" />
              Mobilité & Chauffeurs
            </h3>
            <div className="space-y-2">
              {[
                { name: 'Location de Voiture', desc: 'Gamme SUV, berlines et Premium 4x4', icon: Car },
                { name: 'Transferts Aéroport', desc: 'Navettes et navettes privées avec accueil VIP', icon: Navigation },
                { name: 'Yachts & Bateaux', desc: 'Location de bateaux privés à la Marina', icon: Ship }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={idx}
                    to={`/search?category=${encodeURIComponent(item.name)}`}
                    onClick={onClose}
                    className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all duration-300 group"
                  >
                    <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-white group-hover:shadow-sm group-hover:scale-105 transition-all">
                      <Icon size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">
                        {item.name}
                      </span>
                      <span className="block text-xs text-slate-400 mt-0.5">{item.desc}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Custom activities */}
          <div className="col-span-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Star size={16} strokeWidth={1.5} className="text-emerald-600" />
              Services À la Carte
            </h3>
            <div className="space-y-4 text-sm text-slate-600 font-medium">
              <div className="flex items-center gap-3 px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Fast-track aéroport & douane
              </div>
              <div className="flex items-center gap-3 px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Réservation de tables VIP
              </div>
              <div className="flex items-center gap-3 px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Guides certifiés multilingues
              </div>
              <div className="flex items-center gap-3 px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Photographe professionnel d'excursion
              </div>
            </div>
          </div>

          {/* Premium banner destinations */}
          <div className="col-span-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <MapPin size={16} strokeWidth={1.5} className="text-emerald-600" />
              Transferts d'exception
            </h3>
            <div className="relative h-48 rounded-2xl overflow-hidden shadow-sm group cursor-pointer">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-5 text-white">
                <div className="font-bold text-lg">Hélicoptère & Jet Privé</div>
                <div className="text-xs text-slate-200 mt-1 flex items-center gap-1 font-medium">
                  Contacter la conciergerie <ChevronRight size={12} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get active mapped lists
  const currentMapping = categoryDataMapping[activeCategory] || categoryDataMapping['Surf & Plage'];

  return (
    <div 
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
              const isActive = activeCategory === category.name;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveCategory(category.name)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${
                    isActive ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className={`p-2 bg-white rounded-xl shadow-sm border border-slate-100 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    <Icon size={20} className={category.color} strokeWidth={1.5} />
                  </div>
                  <span className={`text-sm font-semibold transition-colors ${isActive ? 'text-emerald-700' : 'group-hover:text-emerald-600'}`}>
                    {category.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Activities - Mapped dynamically based on hovered category */}
        <div className="col-span-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Star size={16} strokeWidth={1.5} />
            Incontournables
          </h3>
          <div className="space-y-3">
            {currentMapping.incontournables.map((activity, index) => (
              <Link
                key={index}
                to={`/search?q=${encodeURIComponent(activity)}`}
                onClick={onClose}
                className="block px-4 py-2 rounded-xl hover:bg-emerald-50/45 transition-all duration-300 text-sm text-slate-600 hover:text-emerald-700 font-medium group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-emerald-400 transition-colors duration-300"></span>
                  {activity}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Trending Destinations - Mapped dynamically based on hovered category */}
        <div className="col-span-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <MapPin size={16} strokeWidth={1.5} />
            Destinations Phares
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {currentMapping.destinationsPhares.map((dest, idx) => (
              <Link
                key={idx}
                to={`/search?city=${encodeURIComponent(dest.name)}`}
                onClick={onClose}
                className={`group relative block rounded-2xl overflow-hidden shadow-sm col-span-1 h-36`}
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url('${dest.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-colors duration-300" />
                <div className="absolute bottom-5 left-5 text-white">
                  <div className="font-bold text-md tracking-wide mb-1">{dest.name}</div>
                  <div className="text-[11px] text-slate-200 flex items-center gap-1 font-medium opacity-80 group-hover:opacity-100 transition-opacity">
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
          to={`/search?category=${encodeURIComponent(activeCategory)}`}
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40"
        >
          Voir la catégorie {activeCategory}
          <ChevronRight size={16} strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
};

export default DiscoverMenu;
