/**
 * URL de production du site (canonical / OG).
 * Ne jamais utiliser window.location.origin (preview Vercel indexable).
 */
const FALLBACK_SITE_URL = 'https://www.overglow.online';

export const getSiteUrl = () => {
  const fromEnv = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SITE_URL : '';
  const raw = (fromEnv || FALLBACK_SITE_URL).trim().replace(/\/$/, '');
  return raw || FALLBACK_SITE_URL;
};

export const SITE_URL = getSiteUrl();

/** Chemin relatif → URL absolue production */
export const absoluteUrl = (path = '/') => {
  if (!path) return getSiteUrl();
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
};

/** Canonical pour le pathname courant (sans query/hash) */
export const canonicalUrl = (pathname) => {
  const path =
    pathname ||
    (typeof window !== 'undefined' ? window.location.pathname : '/');
  const clean = path.split('?')[0].split('#')[0] || '/';
  return absoluteUrl(clean);
};

export const DEFAULT_OG_IMAGE = absoluteUrl('/vite.svg');

export const LOCALES = ['fr', 'en', 'es', 'ar'];
