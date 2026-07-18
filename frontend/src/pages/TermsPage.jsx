import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink } from '../components/LocalizedLink';

const TermsPage = () => {
  const { t, i18n } = useTranslation();

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
            <FileText className="mx-auto h-16 w-16 text-primary-600 mb-4" />
            <h1 className="text-4xl font-heading font-bold text-gray-900 mb-4">{t('legal.terms_title')}</h1>
            <p className="text-gray-600">
              {t('legal.terms_updated')} : {new Date().toLocaleDateString(i18n.language)}
            </p>
          </div>

          <div className="prose max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms_s1_title')}</h2>
              <p className="text-gray-700 leading-relaxed">{t('legal.terms_s1_body')}</p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms_s2_title')}</h2>
              <p className="text-gray-700 leading-relaxed">{t('legal.terms_s2_body')}</p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms_s3_title')}</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>{t('legal.terms_s3_li1')}</li>
                <li>{t('legal.terms_s3_li2')}</li>
                <li>{t('legal.terms_s3_li3')}</li>
              </ul>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms_s4_title')}</h2>
              <p className="text-gray-700 leading-relaxed">{t('legal.terms_s4_body')}</p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms_s5_title')}</h2>
              <p className="text-gray-700 leading-relaxed">{t('legal.terms_s5_body')}</p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms_s6_title')}</h2>
              <p className="text-gray-700 leading-relaxed">{t('legal.terms_s6_body')}</p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms_s7_title')}</h2>
              <p className="text-gray-700 leading-relaxed">
                <LocalizedLink to="/contact" className="text-primary-600 font-semibold hover:underline">
                  {t('legal.help_link')}
                </LocalizedLink>
                {' · '}
                <LocalizedLink to="/privacy" className="text-primary-600 font-semibold hover:underline">
                  {t('legal.privacy_link')}
                </LocalizedLink>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
