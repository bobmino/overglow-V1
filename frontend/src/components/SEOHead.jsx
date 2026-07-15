import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { buildSeoProps } from '../utils/seo';

/**
 * [INT-02] Helmet SEO réutilisable — title, description, canonical, hreflang, OG.
 */
const SEOHead = ({
  title,
  description,
  pathname,
  image,
  type = 'website',
  noIndex = false,
}) => {
  const { i18n } = useTranslation();
  const seo = buildSeoProps({
    title,
    description,
    pathname:
      pathname ||
      (typeof window !== 'undefined' ? window.location.pathname : '/'),
    lang: i18n.language,
    image,
    type,
    noIndex,
  });

  return (
    <Helmet htmlAttributes={{ lang: seo.lang }}>
      <title>{seo.title}</title>
      {seo.description ? <meta name="description" content={seo.description} /> : null}
      <link rel="canonical" href={seo.canonical} />
      {seo.hreflang.map((link) => (
        <link
          key={link.hreflang}
          rel={link.rel}
          hrefLang={link.hreflang}
          href={link.href}
        />
      ))}
      {seo.noIndex ? <meta name="robots" content="noindex,nofollow" /> : null}
      <meta property="og:title" content={seo.title} />
      {seo.description ? (
        <meta property="og:description" content={seo.description} />
      ) : null}
      <meta property="og:type" content={seo.ogType} />
      <meta property="og:url" content={seo.canonical} />
      <meta property="og:image" content={seo.ogImage} />
      <meta property="og:locale" content={seo.ogLocale} />
      <meta property="og:site_name" content="Overglow Trip" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      {seo.description ? (
        <meta name="twitter:description" content={seo.description} />
      ) : null}
    </Helmet>
  );
};

export default SEOHead;
