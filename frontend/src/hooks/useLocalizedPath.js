import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  withLang,
  normalizeLang,
  detectPreferredLang,
  swapLangInPath,
} from '../utils/i18nRouting';

export const useLocalizedNavigate = () => {
  const navigate = useNavigate();
  const { lang: paramLang } = useParams();
  const { i18n } = useTranslation();
  const lang = normalizeLang(paramLang || i18n.language || detectPreferredLang());

  return useCallback(
    (to, options) => {
      if (typeof to === 'number') {
        navigate(to);
        return;
      }
      if (typeof to === 'string') {
        navigate(withLang(to, lang), options);
        return;
      }
      if (to && typeof to === 'object') {
        navigate(
          { ...to, pathname: withLang(to.pathname || '/', lang) },
          options
        );
      }
    },
    [navigate, lang]
  );
};

export const useSwapLanguage = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  return useCallback(
    (nextLang) => {
      const lng = normalizeLang(nextLang);
      i18n.changeLanguage(lng);
      try {
        localStorage.setItem('i18nextLng', lng);
      } catch {
        /* ignore */
      }
      const { pathname, search } = window.location;
      navigate(swapLangInPath(pathname, lng, search), { replace: true });
    },
    [i18n, navigate]
  );
};
