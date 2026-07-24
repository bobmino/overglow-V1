import React from 'react';
import { useTranslation } from 'react-i18next';
import LocalizedLink from '../LocalizedLink';

/**
 * Cross-sell trip-stack Explore / Stays / Extras.
 */
const TripStackBanner = ({ currentStore = null }) => {
  const { t } = useTranslation();
  const links = [
    { key: 'explore', to: '/explore', label: t('stores.explore.title') },
    { key: 'stays', to: '/stays', label: t('stores.stays.title') },
    { key: 'extras', to: '/extras', label: t('stores.extras.title') },
  ].filter((l) => l.key !== currentStore);

  return (
    <div className="mt-14 rounded-2xl border border-slate-200 bg-white px-5 py-5 md:px-8 md:py-6">
      <p className="text-sm font-semibold text-slate-900 mb-3">
        {t('stores.trip_stack.title', 'Complétez votre voyage')}
      </p>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <LocalizedLink
            key={link.key}
            to={link.to}
            className="inline-flex items-center min-h-10 px-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 hover:border-primary-500 hover:text-primary-700"
          >
            {link.label}
          </LocalizedLink>
        ))}
      </div>
    </div>
  );
};

export default TripStackBanner;
