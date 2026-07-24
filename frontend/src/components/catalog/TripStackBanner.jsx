import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import LocalizedLink from '../LocalizedLink';

/**
 * Cross-sell trip-stack — 3 CTAs immersifs (plus de pills grises).
 */
const TripStackBanner = ({ currentStore = null }) => {
  const { t } = useTranslation();

  const links = [
    {
      key: 'explore',
      to: '/explore',
      label: t('stores.trip_stack.explore', 'Explorer'),
      hint: t('stores.trip_stack.explore_hint', 'Tours & activités authentiques'),
      className: 'from-primary-800 to-teal-700',
    },
    {
      key: 'stays',
      to: '/stays',
      label: t('stores.trip_stack.stays', 'Logements de luxe'),
      hint: t('stores.trip_stack.stays_hint', 'Riads, villas & adresses d’exception'),
      className: 'from-amber-800 to-orange-700',
    },
    {
      key: 'extras',
      to: '/extras',
      label: t('stores.trip_stack.extras', 'Extras & services'),
      hint: t('stores.trip_stack.extras_hint', 'Transferts, guides & conciergerie'),
      className: 'from-slate-800 to-slate-700',
    },
  ];

  return (
    <section className="mt-14">
      <h2 className="text-xl md:text-2xl font-heading font-bold text-slate-900 mb-4">
        {t('stores.trip_stack.title', 'Complétez votre voyage')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {links.map((link) => {
          const isCurrent = currentStore && link.key === currentStore;
          return (
            <LocalizedLink
              key={link.key}
              to={link.to}
              aria-current={isCurrent ? 'page' : undefined}
              className={`group relative block rounded-2xl bg-gradient-to-br ${link.className} text-white p-6 md:p-7 min-h-[140px] hover:shadow-lg transition overflow-hidden ${
                isCurrent ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-slate-100' : ''
              }`}
            >
              <p className="text-sm text-white/80 mb-2">{link.hint}</p>
              <span className="inline-flex items-center gap-2 font-bold text-lg">
                {link.label}
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </span>
            </LocalizedLink>
          );
        })}
      </div>
    </section>
  );
};

export default TripStackBanner;
