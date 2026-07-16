import React from 'react';
import { Users, Mail, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LocalizedLink from '../components/LocalizedLink';
import StaticContentPage from '../components/StaticContentPage';

/**
 * Communauté opérateurs — pas de faux liens sociaux.
 * Forum à venir ; contact et messagerie plateforme uniquement.
 */
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

        <section className="grid sm:grid-cols-2 gap-4">
          <a
            href="mailto:partners@overglowtrip.com?subject=Communaut%C3%A9%20op%C3%A9rateurs"
            className="surface-card p-5 hover:border-primary-400 transition flex gap-3"
          >
            <Mail className="text-primary-600 shrink-0" size={22} />
            <div>
              <p className="font-bold text-slate-900">
                {t('operator.community.email_title', 'Écrire à partenariats')}
              </p>
              <p className="text-sm text-slate-600">partners@overglowtrip.com</p>
            </div>
          </a>
          <LocalizedLink
            to="/operator/inquiries"
            className="surface-card p-5 hover:border-primary-400 transition flex gap-3"
          >
            <MessageSquare className="text-primary-600 shrink-0" size={22} />
            <div>
              <p className="font-bold text-slate-900">
                {t('operator.community.inbox_title', 'Messagerie plateforme')}
              </p>
              <p className="text-sm text-slate-600">
                {t('operator.community.inbox_body', 'Échanges documentés avec clients et support.')}
              </p>
            </div>
          </LocalizedLink>
        </section>
      </div>
    </StaticContentPage>
  );
};

export default OperatorCommunityPage;
