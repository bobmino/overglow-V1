import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { LocalizedLink } from './LocalizedLink';

/**
 * Shell commun pour pages contenu (PROMPT 13).
 */
const StaticContentPage = ({
  title,
  subtitle,
  metaDescription,
  icon: Icon,
  children,
  breadcrumbs,
}) => {
  const { t } = useTranslation();
  return (
  <div className="page-shell">
    <Helmet>
      <title>{title} | Overglow Trip</title>
      {metaDescription && <meta name="description" content={metaDescription} />}
    </Helmet>

    <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white pt-28 pb-16">
      <div className="container mx-auto px-4">
        {breadcrumbs && (
          <nav className="text-sm text-primary-100 mb-4 flex flex-wrap items-center gap-1">
            <LocalizedLink to="/" className="hover:text-white">
              {t('common.home', 'Accueil')}
            </LocalizedLink>
            {breadcrumbs.map((b) => (
              <React.Fragment key={b.label}>
                <span aria-hidden>/</span>
                {b.to ? (
                  <LocalizedLink to={b.to} className="hover:text-white">
                    {b.label}
                  </LocalizedLink>
                ) : (
                  <span className="text-white font-medium">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <div className="max-w-3xl">
          {Icon && <Icon className="h-12 w-12 mb-4 text-primary-100" aria-hidden />}
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">{title}</h1>
          {subtitle && <p className="text-lg md:text-xl text-primary-100">{subtitle}</p>}
        </div>
      </div>
    </section>

    <div className="container mx-auto px-4 py-12 md:py-16">{children}</div>
  </div>
  );
};

export default StaticContentPage;
