/**
 * [INT-02] SEO helpers — meta, canonical, hreflang (aligné sitemap ?lang=).
 */
import { absoluteUrl, canonicalUrl, LOCALES, DEFAULT_OG_IMAGE } from './siteUrl';

const OG_LOCALE = {
  fr: 'fr_FR',
  en: 'en_GB',
  es: 'es_ES',
  ar: 'ar_MA',
};

export const normalizeLang = (lng) => {
  const base = String(lng || 'fr').split('-')[0].toLowerCase();
  return LOCALES.includes(base) ? base : 'fr';
};

/** Absolute URL with ?lang= for alternate/hreflang (matches backend sitemap). */
export const localizedUrl = (pathname, lang) => {
  const base = canonicalUrl(pathname);
  const lng = normalizeLang(lang);
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}lang=${lng}`;
};

export const buildHreflangLinks = (pathname) => {
  const path = pathname || '/';
  return [
    ...LOCALES.map((lang) => ({
      rel: 'alternate',
      hreflang: lang,
      href: localizedUrl(path, lang),
    })),
    {
      rel: 'alternate',
      hreflang: 'x-default',
      href: canonicalUrl(path),
    },
  ];
};

/**
 * Props bag for <SEOHead />.
 */
export const buildSeoProps = ({
  title,
  description,
  pathname,
  lang = 'fr',
  image,
  type = 'website',
  noIndex = false,
} = {}) => {
  const lng = normalizeLang(lang);
  const path = pathname || '/';
  const url = canonicalUrl(path);
  const fullTitle = title
    ? (title.includes('Overglow') ? title : `${title} | Overglow Trip`)
    : 'Overglow Trip';

  return {
    title: fullTitle.slice(0, 70),
    description: (description || '').slice(0, 160),
    canonical: url,
    lang: lng,
    ogLocale: OG_LOCALE[lng] || 'fr_FR',
    ogType: type,
    ogImage: image || DEFAULT_OG_IMAGE,
    hreflang: buildHreflangLinks(path),
    noIndex,
  };
};

export { absoluteUrl, canonicalUrl, DEFAULT_OG_IMAGE, LOCALES };
