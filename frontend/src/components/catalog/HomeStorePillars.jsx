import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import LocalizedLink from '../LocalizedLink';
import { getCityImage } from '../../config/cityMedia';

const PILLARS = [
  {
    key: 'explore',
    to: '/explore',
    image: getCityImage('Marrakech', 'hero'),
    titleKey: 'home.pillar_explore_title',
    titleFallback: 'Explorer',
    subtitleKey: 'home.pillar_explore_subtitle',
    subtitleFallback: 'Tours, activités et expériences authentiques',
    ctaKey: 'home.cta_explore',
  },
  {
    key: 'stays',
    to: '/stays',
    image: getCityImage('Essaouira', 'hero'),
    titleKey: 'home.pillar_stays_title',
    titleFallback: 'Logements',
    subtitleKey: 'home.pillar_stays_subtitle',
    subtitleFallback: 'Riads, villas et adresses d’exception',
    ctaKey: 'home.cta_stays',
  },
  {
    key: 'extras',
    to: '/extras',
    image: getCityImage('Agadir', 'hero'),
    titleKey: 'home.pillar_extras_title',
    titleFallback: 'Extras',
    subtitleKey: 'home.pillar_extras_subtitle',
    subtitleFallback: 'Transferts, guides et services premium',
    ctaKey: 'home.cta_extras',
  },
];

/**
 * Trois piliers immersifs — même signature visuelle que les stores.
 */
const HomeStorePillars = () => {
  const { t } = useTranslation();

  return (
    <section className="px-4 md:px-8">
      <div className="mb-6 md:mb-8 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.2em] text-primary-700 font-semibold mb-2">
              Overglow
            </p>
        <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-slate-900">
          {t('home.pillars_title', 'Composez votre voyage au Maroc')}
        </h2>
        <p className="mt-2 text-slate-600 text-base md:text-lg">
          {t(
            'home.pillars_subtitle',
            'Trois univers, une même exigence : expériences locales, prix en MAD, hôtes vérifiés.'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {PILLARS.map((pillar, index) => (
          <LocalizedLink
            key={pillar.key}
            to={pillar.to}
            className="group relative block h-[340px] md:h-[420px] rounded-3xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          >
            <img
              src={pillar.image}
              alt={t(pillar.titleKey, pillar.titleFallback)}
              className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-105"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-7 text-white">
              <h3 className="font-heading font-bold text-2xl md:text-3xl mb-2">
                {t(pillar.titleKey, pillar.titleFallback)}
              </h3>
              <p className="text-sm md:text-base text-white/85 mb-4 max-w-xs">
                {t(pillar.subtitleKey, pillar.subtitleFallback)}
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-bold tracking-wide">
                {t(pillar.ctaKey)}
                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </span>
            </div>
          </LocalizedLink>
        ))}
      </div>
    </section>
  );
};

export default HomeStorePillars;
