import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink } from '../components/LocalizedLink';

/**
 * Privacy policy page (i18n).
 * NOTE: Copy is product/UX content — have a qualified legal translator
 * review terminology before treating this as an official legal document.
 */
const PrivacyPage = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.slice(0, 2) || 'fr';
  const date = new Date().toLocaleDateString(
    locale === 'ar' ? 'ar-MA' : locale === 'es' ? 'es-ES' : locale === 'en' ? 'en-GB' : 'fr-FR'
  );

  return (
    <div className="page-shell py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <LocalizedLink
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800 mb-6"
        >
          <ArrowLeft size={16} />
          {t('common.back_home', 'Retour à l’accueil')}
        </LocalizedLink>
        <div className="surface-card p-8 md:p-12">
          <div className="text-center mb-12">
            <Shield className="mx-auto h-16 w-16 text-primary-600 mb-4" />
            <h1 className="text-4xl font-heading font-bold text-gray-900 mb-4">{t('privacy.title')}</h1>
            <p className="text-gray-600">{t('privacy.last_updated', { date })}</p>
            <p className="mt-2 text-xs text-gray-400">{t('privacy.legal_note')}</p>
          </div>

          <div className="prose max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.intro_title')}</h2>
              <p className="text-gray-700 leading-relaxed">{t('privacy.intro_body')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.collect_title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">{t('privacy.collect_intro')}</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>{t('privacy.collect_1')}</li>
                <li>{t('privacy.collect_2')}</li>
                <li>{t('privacy.collect_3')}</li>
                <li>{t('privacy.collect_4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.use_title')}</h2>
              <p className="text-gray-700 leading-relaxed">{t('privacy.use_body')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.share_title')}</h2>
              <p className="text-gray-700 leading-relaxed">{t('privacy.share_body')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.rights_title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">{t('privacy.rights_intro')}</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>{t('privacy.rights_1')}</li>
                <li>{t('privacy.rights_2')}</li>
                <li>{t('privacy.rights_3')}</li>
                <li>{t('privacy.rights_4')}</li>
                <li>{t('privacy.rights_5')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.security_title')}</h2>
              <p className="text-gray-700 leading-relaxed">{t('privacy.security_body')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.contact_title')}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t('privacy.contact_body')}{' '}
                <a href="mailto:privacy@overglow.online" className="text-primary-600 hover:underline">
                  privacy@overglow.online
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
