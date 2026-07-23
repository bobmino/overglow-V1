import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { detectPreferredLang, withLang } from '../utils/i18nRouting';

/** `/` → `/{lang}` */
export const RootLangRedirect = () => {
  const lang = detectPreferredLang();
  return <Navigate to={`/${lang}`} replace />;
};

/** Legacy public URL without prefix → `/{lang}/...` */
export const LegacyPublicRedirect = () => {
  const location = useLocation();
  const lang = detectPreferredLang();
  const target = withLang(`${location.pathname}${location.search}`, lang);
  // Critical: preserve location.state (booking payload, checkout context, etc.).
  // Without this, /booking → /fr/booking drops product/date/timeSlot and BookingPage
  // redirects to homepage.
  return (
    <Navigate
      to={`${target}${location.hash || ''}`}
      state={location.state}
      replace
    />
  );
};

export default RootLangRedirect;
