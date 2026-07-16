import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Cookie, Save } from 'lucide-react';
import LocalizedLink from '../components/LocalizedLink';
import {
  DEFAULT_COOKIE_PREFS,
  applyCookiePrefs,
  getCookiePrefs,
  saveCookiePrefs,
} from '../utils/cookieConsent';

/**
 * Préférences cookies (stockage local — pas de CMP externe requis).
 */
const CookieConsentPage = () => {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState(DEFAULT_COOKIE_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(getCookiePrefs());
  }, []);

  const save = () => {
    const next = saveCookiePrefs(prefs);
    setPrefs(next);
    applyCookiePrefs(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="page-shell">
      <Helmet>
        <title>{t('cookies.prefs_title')} | Overglow Trip</title>
      </Helmet>
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white pt-28 pb-14">
        <div className="container mx-auto px-4 max-w-2xl">
          <Cookie className="mb-4" size={40} />
          <h1 className="text-4xl font-heading font-bold mb-2">{t('cookies.prefs_title')}</h1>
          <p className="text-primary-100">{t('cookies.prefs_subtitle')}</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-2xl space-y-4">
        {[
          { key: 'essential', labelKey: 'cookies.cat_essential', descKey: 'cookies.cat_essential_desc', locked: true },
          { key: 'analytics', labelKey: 'cookies.cat_analytics', descKey: 'cookies.cat_analytics_desc', locked: false },
          { key: 'marketing', labelKey: 'cookies.cat_marketing', descKey: 'cookies.cat_marketing_desc', locked: false },
        ].map((row) => (
          <label
            key={row.key}
            className="surface-card p-5 flex items-start justify-between gap-4 cursor-pointer"
          >
            <div>
              <p className="font-bold text-slate-900">{t(row.labelKey)}</p>
              <p className="text-sm text-slate-600">{t(row.descKey)}</p>
            </div>
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={!!prefs[row.key]}
              disabled={row.locked}
              onChange={(e) => setPrefs((p) => ({ ...p, [row.key]: e.target.checked }))}
            />
          </label>
        ))}

        <div className="flex flex-wrap gap-3 pt-4">
          <button type="button" onClick={save} className="btn-primary">
            <Save size={16} /> {t('cookies.save')}
          </button>
          <LocalizedLink to="/cookies" className="btn-secondary">
            {t('cookies.policy_link')}
          </LocalizedLink>
          {saved && (
            <span className="text-sm text-green-700 font-semibold self-center">
              {t('cookies.saved')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookieConsentPage;
