import React, { useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_LANG,
  isSupportedLang,
  normalizeLang,
} from '../utils/i18nRouting';

/**
 * [INT-01] Sync :lang URL param → i18n + localStorage.
 */
const LanguageRoot = () => {
  const { lang } = useParams();
  const { i18n } = useTranslation();
  const valid = isSupportedLang(lang);
  const normalized = normalizeLang(lang);

  useEffect(() => {
    if (!valid) return;
    if (normalizeLang(i18n.language) !== normalized) {
      i18n.changeLanguage(normalized);
    }
    try {
      localStorage.setItem('i18nextLng', normalized);
    } catch {
      /* ignore */
    }
  }, [valid, normalized, i18n]);

  if (!valid) {
    return <Navigate to={`/${DEFAULT_LANG}`} replace />;
  }

  return <Outlet />;
};

export default LanguageRoot;
