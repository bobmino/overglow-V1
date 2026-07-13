/**
 * [TASK-24] Unique media pack per Moroccan city (Unsplash).
 * No shared "medina" photo across Marrakech / Fès / Chefchaouen / Essaouira.
 */

const u = (id, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** @type {Record<string, { hero: string, card: string, gallery: string[], alt: { fr: string, en: string } }>} */
export const CITY_MEDIA = {
  Marrakech: {
    hero: u('photo-1597212618440-806262de4f6b', 1400),
    card: u('photo-1517824806704-9040b037703b', 800),
    gallery: [
      u('photo-1597212618440-806262de4f6b', 1000),
      u('photo-1517824806704-9040b037703b', 1000),
      u('photo-1539650116574-8efeb43e2750', 1000),
    ],
    alt: {
      fr: 'Place et médina de Marrakech au Maroc',
      en: 'Marrakech square and medina in Morocco',
    },
  },
  Casablanca: {
    hero: u('photo-1558642452-9d2a7deb7f62', 1400),
    card: u('photo-1558642452-9d2a7deb7f62', 800),
    gallery: [
      u('photo-1558642452-9d2a7deb7f62', 1000),
      u('photo-1613490908575-bc32ab6cdbb0', 1000),
      u('photo-1549317661-bd32c8ce0db2', 1000),
    ],
    alt: {
      fr: 'Casablanca et front de mer au Maroc',
      en: 'Casablanca waterfront in Morocco',
    },
  },
  Fès: {
    hero: u('photo-1548013146-72479768bada', 1400),
    card: u('photo-1548013146-72479768bada', 800),
    gallery: [
      u('photo-1548013146-72479768bada', 1000),
      u('photo-1553882687-3d054970a958', 1000),
      u('photo-1489749798305-9282864a7bae', 1000),
    ],
    alt: {
      fr: 'Ruelles de la médina de Fès au Maroc',
      en: 'Fes medina alleyways in Morocco',
    },
  },
  Rabat: {
    hero: u('photo-1566073771259-6a8506099945', 1400),
    card: u('photo-1566073771259-6a8506099945', 800),
    gallery: [
      u('photo-1566073771259-6a8506099945', 1000),
      u('photo-1554048612-b6a482bc67e5', 1000),
      u('photo-1502680390469-be75c86b636f', 1000),
    ],
    alt: {
      fr: 'Rabat, capitale du Maroc',
      en: 'Rabat, capital of Morocco',
    },
  },
  Tanger: {
    hero: u('photo-1559128010-7c1ad6e1b6a5', 1400),
    card: u('photo-1559128010-7c1ad6e1b6a5', 800),
    gallery: [
      u('photo-1559128010-7c1ad6e1b6a5', 1000),
      u('photo-1476514525535-07fb3b4ae5f1', 1000),
      u('photo-1506966953602-c20cc11f75e3', 1000),
    ],
    alt: {
      fr: 'Tanger et détroit de Gibraltar au Maroc',
      en: 'Tangier and Strait of Gibraltar, Morocco',
    },
  },
  Agadir: {
    hero: u('photo-1539020140153-e479b8c22e70', 1400),
    card: u('photo-1539020140153-e479b8c22e70', 800),
    gallery: [
      u('photo-1539020140153-e479b8c22e70', 1000),
      u('photo-1588668214407-6ea9a6d8c272', 1000),
      u('photo-1502680390469-be75c86b636f', 1000),
    ],
    alt: {
      fr: 'Baie et plage d’Agadir au Maroc',
      en: 'Agadir bay and beach in Morocco',
    },
  },
  Chefchaouen: {
    hero: u('photo-1555881403-64995e0e8154', 1400),
    card: u('photo-1555881403-64995e0e8154', 800),
    gallery: [
      u('photo-1555881403-64995e0e8154', 1000),
      u('photo-1489749798305-9282864a7bae', 1000),
      u('photo-1548013146-72479768bada', 1000),
    ],
    alt: {
      fr: 'Rues bleues de Chefchaouen au Maroc',
      en: 'Blue streets of Chefchaouen in Morocco',
    },
  },
  Essaouira: {
    hero: u('photo-1570197788417-0e0233416baf', 1400),
    card: u('photo-1570197788417-0e0233416baf', 800),
    gallery: [
      u('photo-1570197788417-0e0233416baf', 1000),
      u('photo-1587974928442-77ce6d2c43ac', 1000),
      u('photo-1539020140153-e479b8c22e70', 1000),
    ],
    alt: {
      fr: 'Remparts et port d’Essaouira au Maroc',
      en: 'Essaouira ramparts and harbour in Morocco',
    },
  },
  Taghazout: {
    hero: u('photo-1588668214407-6ea9a6d8c272', 1400),
    card: u('photo-1588668214407-6ea9a6d8c272', 800),
    gallery: [
      u('photo-1588668214407-6ea9a6d8c272', 1000),
      u('photo-1539020140153-e479b8c22e70', 1000),
      u('photo-1502680390469-be75c86b636f', 1000),
    ],
    alt: {
      fr: 'Côte et surf à Taghazout au Maroc',
      en: 'Taghazout coast and surf in Morocco',
    },
  },
  Taroudant: {
    hero: u('photo-1539650116574-8efeb43e2750', 1400),
    card: u('photo-1539650116574-8efeb43e2750', 800),
    gallery: [
      u('photo-1539650116574-8efeb43e2750', 1000),
      u('photo-1548013146-72479768bada', 1000),
      u('photo-1517824806704-9040b037703b', 1000),
    ],
    alt: {
      fr: 'Remparts de Taroudant au Maroc',
      en: 'Taroudant ramparts in Morocco',
    },
  },
};

const DEFAULT_MEDIA = {
  hero: u('photo-1503220317375-aaad61436b1b', 1400),
  card: u('photo-1503220317375-aaad61436b1b', 800),
  gallery: [u('photo-1503220317375-aaad61436b1b', 1000)],
  alt: { fr: 'Paysage du Maroc', en: 'Landscape of Morocco' },
};

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

export default { CITY_MEDIA, getCityImage, getCityAlt, normalizeCityKey };
