import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass, Home, Search, MapPin } from 'lucide-react';

/**
 * [TASK-10] Page 404 — alignée design system Overglow
 */
const NotFoundPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  const popular = [
    { to: '/search', label: t('not_found.link_search', 'Explorer les expériences') },
    { to: '/how-it-works', label: t('not_found.link_how', 'Comment ça marche') },
    { to: '/culture', label: t('not_found.link_culture', 'Culture marocaine') },
    { to: '/faq', label: t('not_found.link_faq', 'FAQ') },
  ];

  return (
    <>
      <Helmet>
        <title>{t('not_found.meta_title', 'Page introuvable')} | Overglow Trip</title>
        <meta
          name="description"
          content={t('not_found.meta_description', 'Cette page n’existe pas. Continuez votre exploration au Maroc avec Overglow Trip.')}
        />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="page-shell flex items-center justify-center px-4 py-16 md:py-24">
        <div className="w-full max-w-2xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-50 text-primary-600 mb-6">
            <Compass size={36} />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-primary-600 mb-2">404</p>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-3">
            {t('not_found.title', 'Vous vous êtes éloigné du sentier')}
          </h1>
          <p className="text-slate-600 mb-8 max-w-lg mx-auto">
            {t(
              'not_found.subtitle',
              'Cette page n’existe pas ou a été déplacée. Cherchez une expérience, ou revenez à l’accueil.'
            )}
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-10">
            <div className="flex-1 flex items-center gap-2 surface-card px-4 py-3">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('not_found.search_placeholder', 'Surf, médina, désert…')}
                className="w-full outline-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400"
                aria-label={t('not_found.search_aria', 'Rechercher une expérience')}
              />
            </div>
            <button type="submit" className="btn-primary shrink-0">
              {t('not_found.search_cta', 'Rechercher')}
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {popular.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-border text-sm text-slate-700 hover:border-primary-400 hover:text-primary-700 transition"
              >
                <MapPin size={14} className="text-primary-500" />
                {item.label}
              </Link>
            ))}
          </div>

          <Link to="/" className="btn-secondary inline-flex">
            <Home size={16} />
            {t('not_found.back_home', 'Retour à l’accueil')}
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
