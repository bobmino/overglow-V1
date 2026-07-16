import React from 'react';
import { Newspaper, Download, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StaticContentPage from '../components/StaticContentPage';

/**
 * Press kit — no fabricated media mentions (authenticity).
 */
const PressPage = () => {
  const { t } = useTranslation();

  return (
    <StaticContentPage
      title={t('press.title')}
      subtitle={t('press.subtitle')}
      metaDescription={t('press.meta')}
      icon={Newspaper}
      breadcrumbs={[{ label: t('press.title') }]}
    >
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mb-12">
        <section className="surface-card p-6 md:p-8">
          <h2 className="text-xl font-heading font-bold mb-3 flex items-center gap-2">
            <Download size={20} className="text-primary-600" /> {t('press.kit_title')}
          </h2>
          <p className="text-slate-700 mb-4">{t('press.kit_body')}</p>
          <a
            href={`mailto:press@overglowtrip.com?subject=${encodeURIComponent(t('press.kit_email_subject'))}`}
            className="btn-primary"
          >
            {t('press.kit_cta')}
          </a>
        </section>

        <section className="surface-card p-6 md:p-8">
          <h2 className="text-xl font-heading font-bold mb-3">{t('press.logo_title')}</h2>
          <p className="text-slate-700 mb-4">{t('press.logo_body')}</p>
          <a href="/favicon.svg" download className="btn-secondary">
            {t('press.logo_cta')}
          </a>
        </section>
      </div>

      <section className="surface-card p-6 max-w-xl mb-8">
        <h2 className="text-xl font-heading font-bold mb-2">{t('press.mentions_title')}</h2>
        <p className="text-slate-700">{t('press.mentions_body')}</p>
      </section>

      <section className="surface-card p-6 max-w-xl">
        <h2 className="text-xl font-heading font-bold mb-2 flex items-center gap-2">
          <Mail size={20} className="text-primary-600" /> {t('press.contact_title')}
        </h2>
        <p className="text-slate-700 mb-3">{t('press.contact_body')}</p>
        <a
          href="mailto:press@overglowtrip.com"
          className="text-primary-700 font-semibold hover:underline"
        >
          press@overglowtrip.com
        </a>
      </section>
    </StaticContentPage>
  );
};

export default PressPage;
