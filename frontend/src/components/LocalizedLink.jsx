import React, { forwardRef } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { withLang, normalizeLang, detectPreferredLang } from '../utils/i18nRouting';

const resolveLang = (paramLang, i18nLang) => {
  if (paramLang) return normalizeLang(paramLang);
  if (i18nLang) return normalizeLang(i18nLang);
  return detectPreferredLang();
};

/**
 * Link that prefixes public paths with /{lang}.
 * Admin/operator/auth paths stay unprefixed.
 */
export const LocalizedLink = forwardRef(function LocalizedLink(
  { to, ...rest },
  ref
) {
  const { lang: paramLang } = useParams();
  const { i18n } = useTranslation();
  const lang = resolveLang(paramLang, i18n.language);

  const resolved =
    typeof to === 'string'
      ? withLang(to, lang)
      : to && typeof to === 'object'
        ? { ...to, pathname: withLang(to.pathname || '/', lang) }
        : to;

  return <Link ref={ref} to={resolved} {...rest} />;
});

export const LocalizedNavLink = forwardRef(function LocalizedNavLink(
  { to, ...rest },
  ref
) {
  const { lang: paramLang } = useParams();
  const { i18n } = useTranslation();
  const lang = resolveLang(paramLang, i18n.language);

  const resolved =
    typeof to === 'string'
      ? withLang(to, lang)
      : to && typeof to === 'object'
        ? { ...to, pathname: withLang(to.pathname || '/', lang) }
        : to;

  return <NavLink ref={ref} to={resolved} {...rest} />;
});

export default LocalizedLink;
