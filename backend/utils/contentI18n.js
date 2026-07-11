/**
 * Contenu multilingue — résolution de champs localisés.
 * Pattern: champs racine = fallback (souvent FR) + objet i18n optionnel { fr, en, ar, es }.
 */

export const SUPPORTED_LANGS = ['fr', 'en', 'ar', 'es'];
export const DEFAULT_LANG = 'fr';

export const normalizeLang = (lang) => {
  if (!lang || typeof lang !== 'string') return DEFAULT_LANG;
  const short = lang.trim().toLowerCase().slice(0, 2);
  return SUPPORTED_LANGS.includes(short) ? short : DEFAULT_LANG;
};

/**
 * Resolve lang from Express req (query.lang > Accept-Language > default).
 */
export const resolveRequestLang = (req) => {
  if (req?.query?.lang) return normalizeLang(req.query.lang);
  const header = req?.headers?.['accept-language'];
  if (header) {
    const first = String(header).split(',')[0];
    return normalizeLang(first);
  }
  return DEFAULT_LANG;
};

const pickLocalizedValue = (base, i18nBlock, field) => {
  if (i18nBlock && i18nBlock[field] !== undefined && i18nBlock[field] !== null && i18nBlock[field] !== '') {
    return i18nBlock[field];
  }
  return base?.[field];
};

/**
 * Localize a product (or plain object) for a given language.
 * Mutates a shallow copy — never the mongoose doc directly.
 */
export const localizeProduct = (product, lang = DEFAULT_LANG) => {
  if (!product) return product;
  const locale = normalizeLang(lang);
  const plain = typeof product.toObject === 'function' ? product.toObject() : { ...product };
  const i18nRoot = plain.i18n || {};
  const block = i18nRoot[locale] || i18nRoot[DEFAULT_LANG] || {};

  const fields = [
    'title',
    'description',
    'highlights',
    'included',
    'requirements',
    'duration',
  ];

  for (const field of fields) {
    const value = pickLocalizedValue(plain, block, field);
    if (value !== undefined) plain[field] = value;
  }

  if (plain.seo) {
    const seoBlock = block.seo || {};
    plain.seo = {
      ...plain.seo,
      metaTitle: seoBlock.metaTitle || plain.seo.metaTitle || plain.title,
      metaDescription: seoBlock.metaDescription || plain.seo.metaDescription || plain.description,
      ogTitle: seoBlock.ogTitle || plain.seo.ogTitle || plain.title,
      ogDescription: seoBlock.ogDescription || plain.seo.ogDescription || plain.description,
    };
  }

  if (plain.cancellationPolicy) {
    plain.cancellationPolicy = {
      ...plain.cancellationPolicy,
      description:
        block.cancellationDescription ||
        plain.cancellationPolicy.description,
    };
  }

  plain.resolvedLang = locale;
  return plain;
};

export const localizeProducts = (products, lang) => {
  if (!Array.isArray(products)) return [];
  return products.map((p) => localizeProduct(p, lang));
};

export default {
  SUPPORTED_LANGS,
  DEFAULT_LANG,
  normalizeLang,
  resolveRequestLang,
  localizeProduct,
  localizeProducts,
};
