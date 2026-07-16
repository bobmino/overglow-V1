import React from 'react';
import { Users, Instagram, Facebook } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StaticContentPage from '../components/StaticContentPage';

const OperatorCommunityPage = () => {
  const { t } = useTranslation();

  return (
    <StaticContentPage
      title={t('operator.community.title')}
      subtitle={t('operator.community.subtitle')}
      metaDescription={t('operator.community.meta')}
      icon={Users}
      breadcrumbs={[
        { label: t('operator.community.breadcrumb_operator') },
        { label: t('operator.community.breadcrumb_community') },
      ]}
    >
      <div className="max-w-4xl space-y-10">
        <section className="surface-card p-8 text-center">
          <h2 className="text-xl font-heading font-bold mb-2">
            {t('operator.community.forum_title')}
          </h2>
          <p className="text-slate-600 mb-4">{t('operator.community.forum_body')}</p>
          <span className="inline-flex px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
            {t('operator.community.coming_soon')}
          </span>
        </section>

        <section>
          <h2 className="text-xl font-heading font-bold mb-4">
            {t('operator.community.social_title')}
          </h2>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              <Instagram size={18} /> Instagram
            </a>
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              <Facebook size={18} /> Facebook
            </a>
          </div>
        </section>
      </div>
    </StaticContentPage>
  );
};

export default OperatorCommunityPage;
