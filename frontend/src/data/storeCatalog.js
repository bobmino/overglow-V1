/**
 * Curated Extras / Stays teasers — marketing placeholders until DB listings exist.
 * All user-facing copy uses i18n keys (no hardcoded FR/EN strings).
 */
export const CURATED_EXTRAS = [
  {
    id: 'airport-pickup',
    titleKey: 'stores.curated.airport_pickup_title',
    cityKey: 'stores.curated.airport_pickup_city',
    descriptionKey: 'stores.curated.airport_pickup_desc',
    priceFrom: 350,
    badge: 'soon',
    categoryKey: 'stores.extras.type_mobilite',
  },
  {
    id: 'private-shuttle',
    titleKey: 'stores.curated.private_shuttle_title',
    cityKey: 'stores.curated.private_shuttle_city',
    descriptionKey: 'stores.curated.private_shuttle_desc',
    priceFrom: 800,
    badge: 'soon',
    categoryKey: 'stores.extras.type_mobilite',
  },
  {
    id: 'pro-shoot',
    titleKey: 'stores.curated.pro_shoot_title',
    cityKey: 'stores.curated.pro_shoot_city',
    descriptionKey: 'stores.curated.pro_shoot_desc',
    priceFrom: 1200,
    badge: 'soon',
    categoryKey: 'stores.extras.type_photo',
  },
  {
    id: 'concierge',
    titleKey: 'stores.curated.concierge_title',
    cityKey: 'stores.curated.concierge_city',
    descriptionKey: 'stores.curated.concierge_desc',
    priceFrom: 500,
    badge: 'soon',
    categoryKey: 'stores.extras.type_conciergerie',
  },
  {
    id: 'surf-coach',
    titleKey: 'stores.curated.surf_coach_title',
    cityKey: 'stores.curated.surf_coach_city',
    descriptionKey: 'stores.curated.surf_coach_desc',
    priceFrom: 450,
    badge: 'available',
    categoryKey: 'stores.extras.type_loisirs',
  },
  {
    id: 'private-guide',
    titleKey: 'stores.curated.private_guide_title',
    cityKey: 'stores.curated.private_guide_city',
    descriptionKey: 'stores.curated.private_guide_desc',
    priceFrom: 600,
    badge: 'available',
    categoryKey: 'stores.extras.type_guides',
  },
  {
    id: 'yacht-halfday',
    titleKey: 'stores.curated.yacht_title',
    cityKey: 'stores.curated.yacht_city',
    descriptionKey: 'stores.curated.yacht_desc',
    priceFrom: 3500,
    badge: 'soon',
    categoryKey: 'stores.extras.type_premium',
  },
  {
    id: 'spa-hammam',
    titleKey: 'stores.curated.spa_title',
    cityKey: 'stores.curated.spa_city',
    descriptionKey: 'stores.curated.spa_desc',
    priceFrom: 900,
    badge: 'soon',
    categoryKey: 'stores.extras.type_wellness',
  },
];

export const CURATED_STAYS_TEASERS = [
  {
    id: 'villa-pool',
    titleKey: 'stores.curated.villa_title',
    cityKey: 'stores.curated.villa_city',
    descriptionKey: 'stores.curated.villa_desc',
    badge: 'soon',
  },
  {
    id: 'riad-luxe',
    titleKey: 'stores.curated.riad_title',
    cityKey: 'stores.curated.riad_city',
    descriptionKey: 'stores.curated.riad_desc',
    badge: 'soon',
  },
  {
    id: 'ocean-suite',
    titleKey: 'stores.curated.ocean_title',
    cityKey: 'stores.curated.ocean_city',
    descriptionKey: 'stores.curated.ocean_desc',
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

/** Categories shown on /explore (tour catalogue) */
export const EXPLORE_CATEGORY_WHITELIST = [
  'Tours',
  'Attractions',
  'Activities',
  'Outdoor Activities',
  'Food & Drink',
  'Shows & Performances',
  'Day Trips',
  'Classes & Workshops',
];

/** Service category labels for /extras filters */
export const EXTRAS_SERVICE_TYPES = [
  { id: 'mobilite', labelKey: 'stores.extras.type_mobilite', value: 'Mobilité' },
  { id: 'conciergerie', labelKey: 'stores.extras.type_conciergerie', value: 'Conciergerie' },
  { id: 'photographie', labelKey: 'stores.extras.type_photo', value: 'Photographie' },
  { id: 'guides', labelKey: 'stores.extras.type_guides', value: 'Guides' },
  { id: 'bien-etre', labelKey: 'stores.extras.type_wellness', value: 'Bien-être' },
  { id: 'premium', labelKey: 'stores.extras.type_premium', value: 'Premium' },
  { id: 'loisirs', labelKey: 'stores.extras.type_loisirs', value: 'Loisirs' },
];

export const EXTRAS_CATEGORY_VALUES = EXTRAS_SERVICE_TYPES.map((t) => t.value);
