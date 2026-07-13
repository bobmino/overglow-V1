/**
 * [TASK-24 + WebP migration] Unique local WebP media pack per Moroccan city.
 * Assets live in frontend/public/images/cities/*.webp (q≈80).
 * No shared remote Unsplash hotlinks — improves LCP / Core Web Vitals.
 */

const city = (slug, file) => `/images/cities/${slug}-${file}.webp`;

/** @type {Record<string, { hero: string, card: string, gallery: string[], alt: { fr: string, en: string } }>} */
export const CITY_MEDIA = {
  Marrakech: {
    hero: city('marrakech', 'hero'),
    card: city('marrakech', 'card'),
    gallery: [
      city('marrakech', 'hero'),
      city('marrakech', 'card'),
      city('marrakech', 'g2'),
    ],
    alt: {
      fr: 'Place et médina de Marrakech au Maroc',
      en: 'Marrakech square and medina in Morocco',
    },
  },
  Casablanca: {
    hero: city('casablanca', 'hero'),
    card: city('casablanca', 'card'),
    gallery: [
      city('casablanca', 'hero'),
      city('casablanca', 'g1'),
      city('casablanca', 'g2'),
    ],
    alt: {
      fr: 'Casablanca et front de mer au Maroc',
      en: 'Casablanca waterfront in Morocco',
    },
  },
  Fès: {
    hero: city('fes', 'hero'),
    card: city('fes', 'card'),
    gallery: [
      city('fes', 'hero'),
      city('fes', 'g1'),
      city('fes', 'g2'),
    ],
    alt: {
      fr: 'Ruelles de la médina de Fès au Maroc',
      en: 'Fes medina alleyways in Morocco',
    },
  },
  Rabat: {
    hero: city('rabat', 'hero'),
    card: city('rabat', 'card'),
    gallery: [
      city('rabat', 'hero'),
      city('rabat', 'g1'),
      city('rabat', 'g2'),
    ],
    alt: {
      fr: 'Rabat, capitale du Maroc',
      en: 'Rabat, capital of Morocco',
    },
  },
  Tanger: {
    hero: city('tanger', 'hero'),
    card: city('tanger', 'card'),
    gallery: [
      city('tanger', 'hero'),
      city('tanger', 'g1'),
      city('tanger', 'g2'),
    ],
    alt: {
      fr: 'Tanger et détroit de Gibraltar au Maroc',
      en: 'Tangier and Strait of Gibraltar, Morocco',
    },
  },
  Agadir: {
    hero: city('agadir', 'hero'),
    card: city('agadir', 'card'),
    gallery: [
      city('agadir', 'hero'),
      city('agadir', 'g1'),
      city('agadir', 'g2'),
    ],
    alt: {
      fr: 'Baie et plage d’Agadir au Maroc',
      en: 'Agadir bay and beach in Morocco',
    },
  },
  Chefchaouen: {
    hero: city('chefchaouen', 'hero'),
    card: city('chefchaouen', 'card'),
    gallery: [
      city('chefchaouen', 'hero'),
      city('chefchaouen', 'g1'),
      city('chefchaouen', 'g2'),
    ],
    alt: {
      fr: 'Rues bleues de Chefchaouen au Maroc',
      en: 'Blue streets of Chefchaouen in Morocco',
    },
  },
  Essaouira: {
    hero: city('essaouira', 'hero'),
    card: city('essaouira', 'card'),
    gallery: [
      city('essaouira', 'hero'),
      city('essaouira', 'g1'),
      city('essaouira', 'g2'),
    ],
    alt: {
      fr: 'Remparts et port d’Essaouira au Maroc',
      en: 'Essaouira ramparts and harbour in Morocco',
    },
  },
  Taghazout: {
    hero: city('taghazout', 'hero'),
    card: city('taghazout', 'card'),
    gallery: [
      city('taghazout', 'hero'),
      city('taghazout', 'g1'),
      city('taghazout', 'g2'),
    ],
    alt: {
      fr: 'Côte et surf à Taghazout au Maroc',
      en: 'Taghazout coast and surf in Morocco',
    },
  },
  Taroudant: {
    hero: city('taroudant', 'hero'),
    card: city('taroudant', 'card'),
    gallery: [
      city('taroudant', 'hero'),
      city('taroudant', 'g1'),
      city('taroudant', 'g2'),
    ],
    alt: {
      fr: 'Remparts de Taroudant au Maroc',
      en: 'Taroudant ramparts in Morocco',
    },
  },
};

const DEFAULT_MEDIA = {
  hero: '/images/placeholder.webp',
  card: '/images/placeholder.webp',
  gallery: ['/images/placeholder.webp'],
  alt: { fr: 'Paysage du Maroc', en: 'Landscape of Morocco' },
};

/** Local home hero (WebP). */
export const HOME_HERO_IMAGE = '/images/hero-home.webp';

/** Shared product / card placeholder (WebP). */
export const PLACEHOLDER_IMAGE = '/images/placeholder.webp';

const ALIASES = {
  fes: 'Fès',
  'fès': 'Fès',
  fez: 'Fès',
  chaouen: 'Chefchaouen',
  chefchaouen: 'Chefchaouen',
  tangier: 'Tanger',
  tanger: 'Tanger',
  'paradise valley': 'Agadir',
  'taghazout bay': 'Taghazout',
  'agadir marina': 'Agadir',
  "la médina d'agadir": 'Agadir',
  "la medina d'agadir": 'Agadir',
};

export const normalizeCityKey = (name = '') => {
  const raw = String(name).trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();
  if (ALIASES[lower]) return ALIASES[lower];
  const hit = Object.keys(CITY_MEDIA).find((k) => k.toLowerCase() === lower);
  return hit || raw;
};

export const getCityImage = (cityName, variant = 'hero', galleryIndex = 0) => {
  const key = normalizeCityKey(cityName);
  const media = CITY_MEDIA[key] || DEFAULT_MEDIA;
  if (variant === 'gallery') {
    return media.gallery[galleryIndex % media.gallery.length] || media.hero;
  }
  return media[variant] || media.hero;
};

export const getCityAlt = (cityName, lang = 'fr') => {
  const key = normalizeCityKey(cityName);
  const media = CITY_MEDIA[key] || DEFAULT_MEDIA;
  const code = String(lang || 'fr').slice(0, 2);
  return media.alt[code] || media.alt.fr || cityName;
};

export default {
  CITY_MEDIA,
  getCityImage,
  getCityAlt,
  normalizeCityKey,
  HOME_HERO_IMAGE,
  PLACEHOLDER_IMAGE,
};
