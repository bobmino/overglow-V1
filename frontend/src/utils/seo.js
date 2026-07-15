/**
 * [INT-02 + INT-01] SEO helpers — meta, canonical, hreflang with /{lang}/ paths.
 */
import { absoluteUrl, canonicalUrl, LOCALES, DEFAULT_OG_IMAGE } from './siteUrl';
import { withLang, stripLangPrefix, normalizeLang } from './i18nRouting';

const OG_LOCALE = {
  fr: 'fr_FR',
  en: 'en_GB',
  es: 'es_ES',
  ar: 'ar_MA',
};

export { normalizeLang };

/** Absolute localized URL: /fr/explore */
export const localizedUrl = (pathname, lang) => {
  const lng = normalizeLang(lang);
  const stripped = stripLangPrefix(pathname || '/');
  return absoluteUrl(withLang(stripped, lng));
};

export const buildHreflangLinks = (pathname) => {
  const stripped = stripLangPrefix(pathname || '/');
  return [
    ...LOCALES.map((lang) => ({
      rel: 'alternate',
      hreflang: lang,
      href: localizedUrl(stripped, lang),
    })),
    {
      rel: 'alternate',
      hreflang: 'x-default',
      href: absoluteUrl(withLang(stripped, 'fr')),
    },
  ];
};

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
  const stripped = stripLangPrefix(pathname || '/');
  const url = localizedUrl(stripped, lng);
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
    hreflang: buildHreflangLinks(stripped),
    noIndex,
  };
};

export { absoluteUrl, canonicalUrl, DEFAULT_OG_IMAGE, LOCALES };
