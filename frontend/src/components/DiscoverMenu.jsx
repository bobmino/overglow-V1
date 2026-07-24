import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  MapPin,
  Compass,
  Palmtree,
  Tent,
  Camera,
  Utensils,
  Map as MapIcon,
  Star,
  Sparkles,
  Home,
  Car,
  Camera as CameraIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCityImage } from '../config/cityMedia.js';
import LocalizedLink from './LocalizedLink';

const cityImg = (name) => getCityImage(name, 'card');

/**
 * Mega-menu aligné sur le catalogue soft-launch (tours / séjours / extras réels).
 * Les liens pointent vers /explore|/stays|/extras ou recherche ville / fiche produit.
 */
const MENU_DATA = {
  discover: {
    title: 'Explorer',
    icon: Compass,
    categories: [
      { name: 'Surf & Plage', icon: Palmtree, color: 'text-cyan-500' },
      { name: 'Aventure & Nature', icon: Tent, color: 'text-primary-600' },
      { name: 'Visites Guidées', icon: MapIcon, color: 'text-primary-500' },
      { name: 'Gastronomie', icon: Utensils, color: 'text-orange-500' },
      { name: 'Culture & Médina', icon: Camera, color: 'text-rose-500' },
      { name: 'Villes phares', icon: Sparkles, color: 'text-amber-600' },
    ],
    mapping: {
      'Surf & Plage': {
        incontournables: [
          { labelKey: 'mega_menu.link_surf_taghazout', label: 'Surf à Taghazout', to: '/explore?city=Taghazout&taxonomy=activites-aquatiques' },
          { labelKey: 'mega_menu.link_essaouira', label: 'Essaouira — vent & médina', to: '/explore?city=Essaouira' },
          { labelKey: 'mega_menu.link_agadir_coast', label: 'Agadir & côte atlantique', to: '/explore?city=Agadir' },
        ],
        destinationsPhares: [
          { name: 'Taghazout', image: cityImg('Taghazout') },
          { name: 'Agadir', image: cityImg('Agadir') },
        ],
      },
      'Aventure & Nature': {
        incontournables: [
          { labelKey: 'mega_menu.link_agafay', label: 'Désert d’Agafay', to: '/explore?q=agafay&taxonomy=circuits-desert' },
          { labelKey: 'mega_menu.link_toubkal', label: 'Trek Toubkal', to: '/explore?q=toubkal&taxonomy=activites-terrestres' },
          { labelKey: 'mega_menu.link_merzouga', label: 'Désert Merzouga', to: '/explore?city=Merzouga&taxonomy=circuits-desert' },
          { labelKey: 'mega_menu.link_atlas', label: 'Parcours Atlas & oasis', to: '/explore?city=Marrakech' },
        ],
        destinationsPhares: [
          { name: 'Marrakech', image: cityImg('Marrakech') },
          { name: 'Merzouga', image: cityImg('Merzouga') },
        ],
      },
      'Visites Guidées': {
        incontournables: [
          { labelKey: 'mega_menu.link_medina_marrakech', label: 'Médina de Marrakech — guide privé', to: '/explore?city=Marrakech&taxonomy=circuits-culturels' },
          { labelKey: 'mega_menu.link_casablanca', label: 'Casablanca — Hassan II & Corniche', to: '/explore?city=Casablanca&taxonomy=circuits-culturels' },
          { labelKey: 'mega_menu.link_chefchaouen', label: 'Chefchaouen — perle bleue', to: '/explore?city=Chefchaouen&taxonomy=circuits-culturels' },
          { labelKey: 'mega_menu.link_riads_archi', label: 'Architecture riads Marrakech', to: '/explore?city=Marrakech&taxonomy=attractions' },
        ],
        destinationsPhares: [
          { name: 'Marrakech', image: cityImg('Marrakech') },
          { name: 'Casablanca', image: cityImg('Casablanca') },
          { name: 'Chefchaouen', image: cityImg('Chefchaouen') },
        ],
      },
      Gastronomie: {
        incontournables: [
          { labelKey: 'mega_menu.link_tajine_fes', label: 'Atelier cuisine — Fès', to: '/explore?city=Fès&taxonomy=gastronomie' },
          { labelKey: 'mega_menu.link_cuisine_marrakech', label: 'Cours de cuisine Marrakech', to: '/explore?city=Marrakech&taxonomy=gastronomie' },
          { labelKey: 'mega_menu.link_street_food', label: 'Street food médina', to: '/explore?taxonomy=gastronomie' },
          { labelKey: 'mega_menu.link_discover_fes', label: 'Découvrir Fès', to: '/explore?city=Fès' },
        ],
        destinationsPhares: [
          { name: 'Fès', image: cityImg('Fès') },
          { name: 'Marrakech', image: cityImg('Marrakech') },
        ],
      },
      'Culture & Médina': {
        incontournables: [
          { labelKey: 'mega_menu.link_medina_marrakech_city', label: 'Médina de Marrakech', to: '/explore?city=Marrakech&taxonomy=circuits-culturels' },
          { labelKey: 'mega_menu.link_medina_fes', label: 'Médina de Fès', to: '/explore?city=Fès&taxonomy=circuits-culturels' },
          { labelKey: 'mega_menu.link_essaouira_heritage', label: 'Essaouira — patrimoine', to: '/explore?city=Essaouira&taxonomy=circuits-culturels' },
          { labelKey: 'mega_menu.link_chefchaouen_city', label: 'Chefchaouen', to: '/explore?city=Chefchaouen' },
        ],
        destinationsPhares: [
          { name: 'Fès', image: cityImg('Fès') },
          { name: 'Essaouira', image: cityImg('Essaouira') },
          { name: 'Chefchaouen', image: cityImg('Chefchaouen') },
        ],
      },
      'Villes phares': {
        incontournables: [
          { labelKey: 'mega_menu.link_city_marrakech', label: 'Marrakech', to: '/explore?city=Marrakech' },
          { labelKey: 'mega_menu.link_city_fes', label: 'Fès', to: '/explore?city=Fès' },
          { labelKey: 'mega_menu.link_city_essaouira', label: 'Essaouira', to: '/explore?city=Essaouira' },
          { labelKey: 'mega_menu.link_city_agadir', label: 'Agadir / Taghazout', to: '/explore?city=Agadir' },
          { labelKey: 'mega_menu.link_city_casablanca', label: 'Casablanca', to: '/explore?city=Casablanca' },
          { labelKey: 'mega_menu.link_city_chefchaouen', label: 'Chefchaouen', to: '/explore?city=Chefchaouen' },
        ],
        destinationsPhares: [
          { name: 'Marrakech', image: cityImg('Marrakech') },
          { name: 'Casablanca', image: cityImg('Casablanca') },
          { name: 'Chefchaouen', image: cityImg('Chefchaouen') },
        ],
      },
    },
  },
  luxury: {
    title: 'Logements',
    icon: Home,
    categories: [
      { name: 'Villas de Prestige', icon: Home, color: 'text-primary-500' },
      { name: 'Appartements Vue Océan', icon: MapIcon, color: 'text-blue-500' },
      { name: 'Riads Insolites', icon: Sparkles, color: 'text-amber-500' },
    ],
    mapping: {
      'Villas de Prestige': {
        incontournables: [
          { labelKey: 'mega_menu.link_villa_taghazout', label: 'Villa Océan — Taghazout Bay', to: '/stays?propertyType=villa&city=Taghazout' },
          { labelKey: 'mega_menu.link_villa_agadir', label: 'Villa prestige Marina Agadir', to: '/stays?propertyType=villa&city=Agadir' },
          { labelKey: 'mega_menu.link_stays_atlantique', label: 'Séjours luxe Atlantique', to: '/stays?city=Taghazout' },
          { labelKey: 'mega_menu.link_all_stays', label: 'Voir tous les logements', to: '/stays' },
        ],
        destinationsPhares: [
          { name: 'Taghazout', image: cityImg('Taghazout') },
          { name: 'Agadir', image: cityImg('Agadir') },
        ],
      },
      'Appartements Vue Océan': {
        incontournables: [
          { labelKey: 'mega_menu.link_apt_agadir', label: 'Appartement Corniche — Agadir', to: '/stays?propertyType=apartment&city=Agadir' },
          { labelKey: 'mega_menu.link_apt_taghazout', label: 'Duplex Taghazout', to: '/stays?propertyType=apartment&city=Taghazout' },
          { labelKey: 'mega_menu.link_stays_agadir', label: 'Séjours à Agadir', to: '/stays?city=Agadir' },
          { labelKey: 'mega_menu.link_all_stays', label: 'Voir tous les logements', to: '/stays' },
        ],
        destinationsPhares: [
          { name: 'Agadir', image: cityImg('Agadir') },
          { name: 'Taghazout', image: cityImg('Taghazout') },
        ],
      },
      'Riads Insolites': {
        incontournables: [
          { labelKey: 'mega_menu.link_riad_marrakech', label: 'Riad Dar Atlas — Marrakech', to: '/stays?propertyType=riad&city=Marrakech' },
          { labelKey: 'mega_menu.link_riad_essaouira', label: 'Riad Essaouira — médina', to: '/stays?propertyType=riad&city=Essaouira' },
          { labelKey: 'mega_menu.link_riad_fes', label: 'Riad médina Fès', to: '/stays?propertyType=riad&city=Fès' },
          { labelKey: 'mega_menu.link_stays_marrakech', label: 'Séjours à Marrakech', to: '/stays?city=Marrakech' },
        ],
        destinationsPhares: [
          { name: 'Marrakech', image: cityImg('Marrakech') },
          { name: 'Essaouira', image: cityImg('Essaouira') },
        ],
      },
    },
  },
  services: {
    title: 'Extras',
    icon: Star,
    categories: [
      { name: 'Mobilité & Chauffeurs', icon: Car, color: 'text-slate-700' },
      { name: 'Services À la Carte', icon: CameraIcon, color: 'text-yellow-500' },
      { name: 'Bien-être & Premium', icon: Sparkles, color: 'text-rose-500' },
    ],
    mapping: {
      'Mobilité & Chauffeurs': {
        incontournables: [
          { labelKey: 'mega_menu.link_transfer_marrakech', label: 'Transfert aéroport Marrakech', to: '/extras?city=Marrakech&taxonomy=transferts-aeroport' },
          { labelKey: 'mega_menu.link_driver_agadir', label: 'Chauffeur privé — journée Agadir', to: '/extras?city=Agadir&taxonomy=chauffeur-prive' },
          { labelKey: 'mega_menu.link_transfer_agadir', label: 'Transfert aéroport Agadir', to: '/extras?city=Agadir&taxonomy=transferts-aeroport' },
          { labelKey: 'mega_menu.link_all_mobility', label: 'Tous les extras mobilité', to: '/extras?taxonomy=transferts-aeroport' },
        ],
        destinationsPhares: [
          { name: 'Marrakech', image: cityImg('Marrakech') },
          { name: 'Agadir', image: cityImg('Agadir') },
        ],
      },
      'Services À la Carte': {
        incontournables: [
          { labelKey: 'mega_menu.link_guide_fes', label: 'Guide privé — médina de Fès', to: '/extras?city=Fès&taxonomy=guide-medina' },
          { labelKey: 'mega_menu.link_photo_marrakech', label: 'Photographe pro — Marrakech', to: '/extras?city=Marrakech&taxonomy=photographie' },
          { labelKey: 'mega_menu.link_concierge', label: 'Conciergerie 24/7', to: '/extras?taxonomy=conciergerie' },
          { labelKey: 'mega_menu.link_all_extras', label: 'Tous les extras', to: '/extras' },
        ],
        destinationsPhares: [
          { name: 'Fès', image: cityImg('Fès') },
          { name: 'Marrakech', image: cityImg('Marrakech') },
        ],
      },
      'Bien-être & Premium': {
        incontournables: [
          { labelKey: 'mega_menu.link_hammam', label: 'Hammam & spa privé', to: '/extras?q=hammam' },
          { labelKey: 'mega_menu.link_surf_coaching', label: 'Coaching surf privé', to: '/extras?q=surf' },
          { labelKey: 'mega_menu.link_yacht', label: 'Sortie yacht Marina', to: '/extras?q=yacht' },
          { labelKey: 'mega_menu.link_all_extras', label: 'Tous les extras', to: '/extras' },
        ],
        destinationsPhares: [
          { name: 'Marrakech', image: cityImg('Marrakech') },
          { name: 'Agadir', image: cityImg('Agadir') },
        ],
      },
    },
  },
};

const DiscoverMenu = ({ isOpen, onClose, menuType = 'discover' }) => {
  const { t } = useTranslation();
  const data = MENU_DATA[menuType] || MENU_DATA.discover;
  const [activeCategory, setActiveCategory] = useState(data.categories[0].name);

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

  const transKeyMap = {
    'Surf & Plage': 'surf_plage',
    'Aventure & Nature': 'aventure_nature',
    'Visites Guidées': 'visites_guidees',
    Gastronomie: 'gastronomie',
    'Culture & Médina': 'culture_medina',
    'Villes phares': 'villes_phares',
    'Villas de Prestige': 'villas_prestige',
    'Appartements Vue Océan': 'apparts_vue_ocean',
    'Riads Insolites': 'riads_insolites',
    'Mobilité & Chauffeurs': 'mobilite_chauffeurs',
    'Services À la Carte': 'services_carte',
    'Bien-être & Premium': 'bien_etre_premium',
  };

  return (
    <div
      className="fixed top-[80px] start-1/2 -translate-x-1/2 pt-3 bg-transparent z-[100] w-[95vw] max-w-7xl"
      onMouseEnter={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 p-10 min-h-[400px] flex flex-col animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="grid grid-cols-4 gap-12 flex-grow">
          <div className="col-span-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <CategoryIcon size={16} strokeWidth={1.5} />
              {t('menu.categories')}
            </h3>
            <div className="space-y-2">
              {data.categories.map((category, idx) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.name;
                const tKey = transKeyMap[category.name]
                  ? `mega_menu.${transKeyMap[category.name]}`
                  : category.name;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setActiveCategory(category.name)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${
                      isActive ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`p-2 bg-white rounded-xl shadow-sm border border-slate-100 transition-transform duration-300 ${
                        isActive ? 'scale-110' : 'group-hover:scale-110'
                      }`}
                    >
                      <Icon size={20} className={category.color} strokeWidth={1.5} />
                    </div>
                    <span
                      className={`text-sm font-semibold transition-colors ${
                        isActive ? 'text-primary-700' : 'group-hover:text-primary-600'
                      }`}
                    >
                      {t(tKey, category.name)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="col-span-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Star size={16} strokeWidth={1.5} />
              {t('menu.incontournables')}
            </h3>
            <div className="space-y-3">
              {currentMapping.incontournables.map((activity, index) => {
                const fallback = typeof activity === 'string' ? activity : activity.label;
                const label = typeof activity === 'string'
                  ? activity
                  : t(activity.labelKey || fallback, { defaultValue: fallback });
                const to = typeof activity === 'string' ? storePath : activity.to || storePath;
                return (
                  <LocalizedLink
                    key={index}
                    to={to}
                    onClick={onClose}
                    className="block px-4 py-2 rounded-xl hover:bg-primary-50/45 transition-all duration-300 text-sm text-slate-600 hover:text-primary-700 font-medium group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-primary-400 transition-colors duration-300" />
                      {label}
                    </div>
                  </LocalizedLink>
                );
              })}
            </div>
          </div>

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
                  className="group relative block rounded-2xl overflow-hidden shadow-sm col-span-1 h-36"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url('${dest.image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent md:from-black/45 group-hover:from-black/65 transition-colors duration-300" />
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
