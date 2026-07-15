/**
 * [INT-01] Routing i18n — préfixes /fr|/en|/es|/ar
 */
export const SUPPORTED_LANGS = ['fr', 'en', 'es', 'ar'];
export const DEFAULT_LANG = 'fr';

/** Paths that must NEVER get a language prefix */
export const LANG_EXEMPT_PREFIXES = [
  '/admin',
  '/operator',
  '/login',
  '/register',
  '/reset-password',
  '/checkout',
  '/booking-success',
  '/dashboard',
  '/profile',
  '/favorites',
  '/loyalty',
  '/view-history',
  '/notifications',
  '/api',
];

export const isSupportedLang = (value) =>
  SUPPORTED_LANGS.includes(String(value || '').split('-')[0].toLowerCase());

export const normalizeLang = (value) => {
  const base = String(value || DEFAULT_LANG).split('-')[0].toLowerCase();
  return isSupportedLang(base) ? base : DEFAULT_LANG;
};

export const isLangExemptPath = (pathname = '') => {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return LANG_EXEMPT_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
};

/** `/fr/explore` → `/explore` ; `/admin` → `/admin` */
export const stripLangPrefix = (pathname = '/') => {
  const parts = String(pathname).split('/').filter(Boolean);
  if (parts.length && isSupportedLang(parts[0])) {
    const rest = parts.slice(1).join('/');
    return rest ? `/${rest}` : '/';
  }
  return pathname.startsWith('/') ? pathname : `/${pathname}` || '/';
};

/** Prefer current URL lang, then i18n/localStorage, then default */
export const detectPreferredLang = () => {
  if (typeof window !== 'undefined') {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts[0] && isSupportedLang(parts[0])) return parts[0];
    try {
      const stored = localStorage.getItem('i18nextLng');
      if (stored) return normalizeLang(stored);
    } catch {
      /* ignore */
    }
    const nav = navigator.language || navigator.userLanguage;
    if (nav) return normalizeLang(nav);
  }
  return DEFAULT_LANG;
};

/**
 * Build a localized path for public pages.
 * Exempt paths are returned unchanged. Query strings are preserved.
 */
export const withLang = (pathname = '/', lang) => {
  const raw = String(pathname || '/');
  const qIndex = raw.indexOf('?');
  const pathOnly = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
  const search = qIndex >= 0 ? raw.slice(qIndex) : '';
  const clean = stripLangPrefix(pathOnly);
  if (isLangExemptPath(clean)) return `${clean}${search}`;
  const lng = normalizeLang(lang || detectPreferredLang());
  if (clean === '/') return `/${lng}${search}`;
  return `/${lng}${clean}${search}`;
};

/** Swap language segment in current path (or prefix if missing). */
export const swapLangInPath = (pathname, nextLang, search = '') => {
  const lng = normalizeLang(nextLang);
  if (isLangExemptPath(pathname)) {
    return `${pathname}${search || ''}`;
  }
  const stripped = stripLangPrefix(pathname);
  const nextPath = stripped === '/' ? `/${lng}` : `/${lng}${stripped}`;
  return `${nextPath}${search || ''}`;
};
