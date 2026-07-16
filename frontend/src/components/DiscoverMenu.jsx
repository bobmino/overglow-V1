import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, MapPin, Compass, Palmtree, Tent, Camera, Utensils, 
  Map as MapIcon, Star, Sparkles, Home, Car, Navigation, Ship
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCityImage } from '../config/cityMedia.js';
import LocalizedLink from './LocalizedLink';

const cityImg = (name) => getCityImage(name, 'card');

const MENU_DATA = {
  discover: {
    title: "Explorer",
    icon: Compass,
    categories: [
      { name: 'Surf & Plage', icon: Palmtree, color: 'text-cyan-500' },
      { name: 'Aventure & Nature', icon: Tent, color: 'text-primary-600' },
      { name: 'Visites Guidées', icon: MapIcon, color: 'text-primary-500' },
      { name: 'Gastronomie', icon: Utensils, color: 'text-orange-500' },
      { name: 'Culture & Médina', icon: Camera, color: 'text-rose-500' },
      { name: 'Détente & Bien-être', icon: Sparkles, color: 'text-purple-500' }
    ],
    mapping: {
      'Surf & Plage': {
        incontournables: ["Surf Camp Taghazout", "Sunset Yoga on the Beach", "Jet Ski Adventure Agadir", "Plage sauvage d'Imouran", "Balade en catamaran au coucher du soleil"],
        destinationsPhares: [
          { name: 'Taghazout', image: cityImg('Taghazout') },
          { name: 'Agadir', image: cityImg('Agadir') }
        ]
      },
      'Aventure & Nature': {
        incontournables: ["Excursion Paradise Valley", "Quad dans les dunes de sable", "Randonnée Atlas & Oasis", "Survol en Montgolfière Agadir", "Buggy Safari & Thé chez l'habitant"],
        destinationsPhares: [
          { name: 'Paradise Valley', image: cityImg('Agadir') },
          { name: 'Imouzzer', image: cityImg('Agadir') }
        ]
      },
      'Visites Guidées': {
        incontournables: ["Visite d'Agadir Oufella", "Découverte guidée du Souk El Had", "Journée guidée à Taroudant & Tiout", "Excursion historique Essaouira", "Marrakech Express en 1 jour"],
        destinationsPhares: [
          { name: 'Essaouira', image: cityImg('Essaouira') },
          { name: 'Taroudant', image: cityImg('Taroudant') }
        ]
      },
      'Gastronomie': {
        incontournables: ["Cours de cuisine marocaine traditionnelle", "Dégustation d'Argan & Miel à Amalou", "Dîner spectacle sous tente Caïdale", "Street food tour dans la médina", "Parcours des thés et pâtisseries fines"],
        destinationsPhares: [
          { name: 'Marrakech', image: cityImg('Marrakech') },
          { name: 'Agadir', image: cityImg('Agadir') }
        ]
      },
      'Culture & Médina': {
        incontournables: ["Musée de la Culture Amazighe", "Médina de Coco Polizzi", "Palais de Taroudant et remparts", "Heritage tour & conteurs traditionnels", "Visite des ateliers coopératifs d'artisans"],
        destinationsPhares: [
          { name: 'Fès', image: cityImg('Fès') },
          { name: 'Chefchaouen', image: cityImg('Chefchaouen') }
        ]
      },
      'Détente & Bien-être': {
        incontournables: ["Spa & Hammam traditionnel privatif", "Massage aux huiles essentielles d'Argan", "Retraite Yoga & Sound Healing", "Bain de boue & enveloppement d'argile", "Thalassothérapie face à l'océan"],
        destinationsPhares: [
          { name: 'Taghazout Bay', image: cityImg('Taghazout') },
          { name: 'Agadir Marina', image: cityImg('Agadir') }
        ]
      }
    }
  },
  luxury: {
    title: "Logements",
    icon: Home,
    categories: [
      { name: 'Villas de Prestige', icon: Home, color: 'text-primary-500' },
      { name: 'Appartements Vue Océan', icon: MapIcon, color: 'text-blue-500' },
      { name: 'Riads Insolites', icon: Sparkles, color: 'text-amber-500' }
    ],
    mapping: {
      'Villas de Prestige': {
        incontournables: ["Villa avec piscine privée", "Service de conciergerie 24/7", "Chef à domicile", "Transfert VIP inclus", "Accès plage privée"],
        destinationsPhares: [
          { name: 'Taghazout Bay', image: cityImg('Taghazout') },
          { name: 'Agadir Marina', image: cityImg('Agadir') }
        ]
      },
      'Appartements Vue Océan': {
        incontournables: ["Duplex haut standing", "Vue panoramique sur mer", "Jacuzzi sur terrasse", "Accès aux clubs privés", "Service de ménage quotidien"],
        destinationsPhares: [
          { name: 'Agadir', image: cityImg('Agadir') },
          { name: 'Taghazout', image: cityImg('Taghazout') }
        ]
      },
      'Riads Insolites': {
        incontournables: ["Riad traditionnel luxueux", "Patio avec fontaine", "Hammam privé", "Dîner gastronomique marocain", "Excursions personnalisées"],
        destinationsPhares: [
          { name: 'Taroudant', image: cityImg('Taroudant') },
          { name: 'Marrakech', image: cityImg('Marrakech') }
        ]
      }
    }
  },
  services: {
    title: "Extras",
    icon: Star,
    categories: [
      { name: 'Mobilité & Chauffeurs', icon: Car, color: 'text-slate-700' },
      { name: 'Services À la Carte', icon: Star, color: 'text-yellow-500' }
    ],
    mapping: {
      'Mobilité & Chauffeurs': {
        incontournables: ["Transferts aéroport VIP", "Location SUV avec chauffeur", "Yachts & Bateaux privés", "Hélicoptère & Jet Privé", "Mise à disposition 24h/24"],
        destinationsPhares: [
          { name: 'Aéroport Agadir', image: cityImg('Agadir') },
          { name: 'Marina Agadir', image: cityImg('Agadir') }
        ]
      },
      'Services À la Carte': {
        incontournables: ["Fast-track aéroport & douane", "Réservation de tables VIP", "Guides certifiés multilingues", "Photographe professionnel", "Organisation d'événements privés"],
        destinationsPhares: [
          { name: 'Agadir', image: cityImg('Agadir') },
          { name: 'Taghazout', image: cityImg('Taghazout') }
        ]
      }
    }
  }
};

const DiscoverMenu = ({ isOpen, onClose, menuType = 'discover' }) => {
  const { t } = useTranslation();
  const data = MENU_DATA[menuType] || MENU_DATA.discover;
  const [activeCategory, setActiveCategory] = useState(data.categories[0].name);

  // Reset category when menuType changes
  useEffect(() => {
    setActiveCategory(data.categories[0].name);
  }, [menuType, data]);

  if (!isOpen) return null;

  const currentMapping = data.mapping[activeCategory] || data.mapping[data.categories[0].name];
  const CategoryIcon = data.icon;
  const storePath =
    menuType === 'luxury' ? '/stays' : menuType === 'services' ? '/extras' : '/explore';
  const viewAllHref = storePath;

  const resolveCityHref = (name) => {
    const aliases = {
      'Taghazout Bay': 'Taghazout',
      'Agadir Marina': 'Agadir',
      'Marina Agadir': 'Agadir',
      'Paradise Valley': 'Agadir',
      'Aéroport Agadir': 'Agadir',
      Imouzzer: 'Agadir',
    };
    const city = aliases[name] || name;
    return `${storePath}?city=${encodeURIComponent(city)}`;
  };

  return (
    <div 
      className="fixed top-[80px] start-1/2 -translate-x-1/2 pt-3 bg-transparent z-[100] w-[95vw] max-w-7xl"
      onMouseEnter={(e) => e.stopPropagation()}
    >
      {/* pt-3 = pont hover invisible (évite l'écart mt qui ferme le menu) */}
      <div
        className="bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 p-10 min-h-[400px] flex flex-col animate-in fade-in slide-in-from-top-4 duration-300"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
      <div className="grid grid-cols-4 gap-12 flex-grow">
        {/* Top Categories */}
        <div className="col-span-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <CategoryIcon size={16} strokeWidth={1.5} />
            {t('menu.categories')}
          </h3>
          <div className="space-y-2">
            {data.categories.map((category, idx) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.name;
              
              // Try to map to translation key
              const transKeyMap = {
                'Surf & Plage': 'surf_plage',
                'Aventure & Nature': 'aventure_nature',
                'Visites Guidées': 'visites_guidees',
                'Gastronomie': 'gastronomie',
                'Culture & Médina': 'culture_medina',
                'Détente & Bien-être': 'detente_bien_etre',
                'Villas de Prestige': 'villas_prestige',
                'Appartements Vue Océan': 'apparts_vue_ocean',
                'Riads Insolites': 'riads_insolites',
                'Mobilité & Chauffeurs': 'mobilite_chauffeurs',
                'Services À la Carte': 'services_carte'
              };
              const tKey = transKeyMap[category.name] ? `mega_menu.${transKeyMap[category.name]}` : category.name;
              
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveCategory(category.name)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${
                    isActive ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className={`p-2 bg-white rounded-xl shadow-sm border border-slate-100 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    <Icon size={20} className={category.color} strokeWidth={1.5} />
                  </div>
                  <span className={`text-sm font-semibold transition-colors ${isActive ? 'text-primary-700' : 'group-hover:text-primary-600'}`}>
                    {t(tKey, category.name)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Activities */}
        <div className="col-span-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Star size={16} strokeWidth={1.5} />
            {t('menu.incontournables')}
          </h3>
          <div className="space-y-3">
            {currentMapping.incontournables.map((activity, index) => (
              <LocalizedLink
                key={index}
                to={storePath}
                onClick={onClose}
                className="block px-4 py-2 rounded-xl hover:bg-primary-50/45 transition-all duration-300 text-sm text-slate-600 hover:text-primary-700 font-medium group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-primary-400 transition-colors duration-300"></span>
                  {activity}
                </div>
              </LocalizedLink>
            ))}
          </div>
        </div>

        {/* Trending Destinations */}
        <div className="col-span-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <MapPin size={16} strokeWidth={1.5} />
            {t('menu.destinationsPhares')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {currentMapping.destinationsPhares.map((dest, idx) => (
              <LocalizedLink
                key={idx}
                to={resolveCityHref(dest.name)}
                onClick={onClose}
                className={`group relative block rounded-2xl overflow-hidden shadow-sm col-span-1 h-36`}
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url('${dest.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-colors duration-300" />
                <div className="absolute bottom-5 start-5 text-white">
                  <div className="font-bold text-md tracking-wide mb-1">{dest.name}</div>
                  <div className="text-[11px] text-slate-200 flex items-center gap-1 font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                    {t('menu.exploreRegion')} <ChevronRight size={12} strokeWidth={2} />
                  </div>
                </div>
              </LocalizedLink>
            ))}
          </div>
        </div>
      </div>

      {/* View All Link */}
      <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
        <LocalizedLink
          to={viewAllHref}
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40"
        >
          {t('menu.viewCategory')} {data.title}
          <ChevronRight size={16} strokeWidth={2} />
        </LocalizedLink>
      </div>
      </div>
    </div>
  );
};

export default DiscoverMenu;
