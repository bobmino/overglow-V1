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
  return <Navigate to={target} replace />;
};

export default RootLangRedirect;
