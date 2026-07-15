/**
 * Curated Extras — services premium (upsell post-séjour / post-activité).
 * Shown when DB has few/no `productType=service` listings.
 */
export const CURATED_EXTRAS = [
  {
    id: 'airport-pickup',
    title: 'Transfert aéroport VIP',
    city: 'Agadir / Marrakech',
    description: 'Accueil nominatif, véhicule climatisé, suivi de vol en temps réel.',
    priceFrom: 350,
    badge: 'soon',
    category: 'Mobilité',
  },
  {
    id: 'private-shuttle',
    title: 'Navette privée inter-villes',
    city: 'Maroc',
    description: 'Trajets confort Agadir–Essaouira, Marrakech–Fès, etc. chauffeur dédié.',
    priceFrom: 800,
    badge: 'soon',
    category: 'Mobilité',
  },
  {
    id: 'pro-shoot',
    title: 'Séance photo professionnelle',
    city: 'Médina & côte',
    description: 'Portrait voyage, couple ou famille — livrable sous 48 h.',
    priceFrom: 1200,
    badge: 'soon',
    category: 'Lifestyle',
  },
  {
    id: 'concierge',
    title: 'Conciergerie 24/7',
    city: 'Sur place',
    description: 'Réservations restaurants, hammam, billetterie spectacles.',
    priceFrom: 500,
    badge: 'soon',
    category: 'Conciergerie',
  },
  {
    id: 'surf-coach',
    title: 'Coaching surf privé',
    city: 'Taghazout',
    description: 'Cours 1:1 avec moniteur certifié — planche incluse.',
    priceFrom: 450,
    badge: 'available',
    category: 'Loisirs',
  },
  {
    id: 'private-guide',
    title: 'Guide privé multilingue',
    city: 'Médinas',
    description: 'FR / EN / ES / AR — demi-journée ou journée complète.',
    priceFrom: 600,
    badge: 'available',
    category: 'Guides',
  },
  {
    id: 'yacht-halfday',
    title: 'Sortie yacht demi-journée',
    city: 'Agadir Marina',
    description: 'Skipper inclus, soft drinks, sunset option.',
    priceFrom: 3500,
    badge: 'soon',
    category: 'Premium',
  },
  {
    id: 'spa-hammam',
    title: 'Hammam & spa privé',
    city: 'Riad / spa partenaire',
    description: 'Rituel traditionnel + massage argan pour 2 personnes.',
    priceFrom: 900,
    badge: 'soon',
    category: 'Bien-être',
  },
];

export const CURATED_STAYS_TEASERS = [
  {
    id: 'villa-pool',
    title: 'Villas avec piscine privée',
    city: 'Taghazout Bay & Agadir',
    description: 'Haut standing, conciergerie, vue océan ou Atlas.',
    badge: 'soon',
  },
  {
    id: 'riad-luxe',
    title: 'Riads de charme',
    city: 'Marrakech & Taroudant',
    description: 'Patio, hammam privé, petit-déjeuner gastronomique.',
    badge: 'soon',
  },
  {
    id: 'ocean-suite',
    title: 'Suites vue océan',
    city: 'Agadir & Essaouira',
    description: 'Appartements et duplex luxe face à l’Atlantique.',
    badge: 'soon',
  },
];

export const STORE_CONFIG = {
  explore: {
    productType: 'tour',
    titleKey: 'stores.explore.title',
    subtitleKey: 'stores.explore.subtitle',
    path: '/explore',
  },
  stays: {
    productType: 'luxury_stay',
    titleKey: 'stores.stays.title',
    subtitleKey: 'stores.stays.subtitle',
    path: '/stays',
  },
  extras: {
    productType: 'service',
    titleKey: 'stores.extras.title',
    subtitleKey: 'stores.extras.subtitle',
    path: '/extras',
  },
};

export const CITY_ALIASES = {
  'Taghazout Bay': 'Taghazout',
  'Agadir Marina': 'Agadir',
  'Marina Agadir': 'Agadir',
  'Paradise Valley': 'Agadir',
  'Aéroport Agadir': 'Agadir',
  Imouzzer: 'Agadir',
};
