import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LocalizedLink from './LocalizedLink';
import { applyCookiePrefs, hasCookieDecision, saveCookiePrefs } from '../utils/cookieConsent';

/**
 * GDPR cookie banner — blocks analytics until explicit choice.
 */
const CookieBanner = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasCookieDecision());
  }, []);

  const decide = (prefs) => {
    saveCookiePrefs(prefs);
    applyCookiePrefs(prefs);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[60] p-4 md:p-6 pointer-events-none"
      role="dialog"
      aria-label={t('cookies.banner_aria')}
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-xl p-5 md:p-6">
        <p className="text-sm text-slate-700 leading-relaxed mb-4">
          {t('cookies.banner_text')}{' '}
          <LocalizedLink to="/cookies" className="text-primary-700 font-semibold underline">
            {t('cookies.policy_link')}
          </LocalizedLink>
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => decide({ essential: true, analytics: false, marketing: false })}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
          >
            {t('cookies.essential_only')}
          </button>
          <LocalizedLink
            to="/cookie-consent"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition text-center"
            onClick={() => setVisible(false)}
          >
            {t('cookies.customize')}
          </LocalizedLink>
          <button
            type="button"
            onClick={() => decide({ essential: true, analytics: true, marketing: true })}
            className="px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition"
          >
            {t('cookies.accept_all')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
