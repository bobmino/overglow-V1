import React from 'react';
import { Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LocalizedLink from './LocalizedLink';

/**
 * [TASK-11] Footer i18n — faux badge Trustpilot retiré
 * [INT-01] Liens publics préfixés /{lang}
 * Sociaux génériques retirés (pas de faux profils) — contact email réel uniquement.
 */
const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="bg-slate-800 py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-slate-200">
            {t('footer.tagline', 'Expériences authentiques au Maroc, sélectionnées avec soin.')}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-sm mb-4">{t('footer.col_support', 'Support')}</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><LocalizedLink to="/help" className="hover:text-white transition">{t('footer.help_center')}</LocalizedLink></li>
              <li><LocalizedLink to="/contact" className="hover:text-white transition">{t('footer.contact_us')}</LocalizedLink></li>
              <li><LocalizedLink to="/faq" className="hover:text-white transition">{t('footer.faq')}</LocalizedLink></li>
              <li><LocalizedLink to="/loyalty" className="hover:text-white transition">{t('footer.loyalty', 'Programme de fidélité')}</LocalizedLink></li>
              <li><LocalizedLink to="/safety" className="hover:text-white transition">{t('footer.safety')}</LocalizedLink></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm mb-4">{t('footer.col_about', 'À propos')}</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><LocalizedLink to="/about" className="hover:text-white transition">{t('footer.about')}</LocalizedLink></li>
              <li><LocalizedLink to="/culture" className="hover:text-white transition">{t('footer.discover_morocco')}</LocalizedLink></li>
              <li><LocalizedLink to="/blog" className="hover:text-white transition">{t('footer.blog')}</LocalizedLink></li>
              <li><LocalizedLink to="/careers" className="hover:text-white transition">{t('footer.careers')}</LocalizedLink></li>
              <li><LocalizedLink to="/press" className="hover:text-white transition">{t('footer.press')}</LocalizedLink></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm mb-4">{t('footer.col_operators', 'Pour les opérateurs')}</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><LocalizedLink to="/affiliate" className="hover:text-white transition">{t('footer.become_partner')}</LocalizedLink></li>
              <li><LocalizedLink to="/operator/help" className="hover:text-white transition">{t('footer.operator_help')}</LocalizedLink></li>
              <li><LocalizedLink to="/operator/resources" className="hover:text-white transition">{t('footer.operator_resources')}</LocalizedLink></li>
              <li><LocalizedLink to="/operator/community" className="hover:text-white transition">{t('footer.operator_community')}</LocalizedLink></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm mb-4">{t('footer.col_legal', 'Légal')}</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><LocalizedLink to="/terms" className="hover:text-white transition">{t('footer.terms')}</LocalizedLink></li>
              <li><LocalizedLink to="/privacy" className="hover:text-white transition">{t('footer.privacy')}</LocalizedLink></li>
              <li><LocalizedLink to="/cookies" className="hover:text-white transition">{t('footer.cookies')}</LocalizedLink></li>
              <li><LocalizedLink to="/accessibility" className="hover:text-white transition">{t('footer.accessibility')}</LocalizedLink></li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 py-6 border-t border-slate-700">
          <a
            href="mailto:hello@overglowtrip.com"
            className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-primary-400 transition"
            aria-label={t('footer.contact_email', 'Nous écrire')}
          >
            <Mail size={20} />
            <span>hello@overglowtrip.com</span>
          </a>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-slate-700 text-xs text-slate-400">
          <p>{t('footer.copyright', { year })}</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <LocalizedLink to="/terms" className="hover:text-white transition">{t('footer.terms')}</LocalizedLink>
            <LocalizedLink to="/how-it-works" className="hover:text-white transition">{t('footer.how_it_works')}</LocalizedLink>
            <LocalizedLink to="/cookie-consent" className="hover:text-white transition">{t('footer.cookie_consent')}</LocalizedLink>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
