import React from 'react';
import { Briefcase, Heart, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StaticContentPage from '../components/StaticContentPage';

/**
 * Careers — no fake open roles. Spontaneous applications only until real jobs exist in DB/admin.
 */
const CareersPage = () => {
  const { t } = useTranslation();
  const culture = t('careers.culture_items', { returnObjects: true, defaultValue: [] });

  return (
    <StaticContentPage
      title={t('careers.title')}
      subtitle={t('careers.subtitle')}
      metaDescription={t('careers.meta')}
      icon={Briefcase}
      breadcrumbs={[{ label: t('careers.title') }]}
    >
      <section className="max-w-3xl mb-12">
        <h2 className="text-2xl font-heading font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Heart size={22} className="text-primary-600" /> {t('careers.mission_title')}
        </h2>
        <p className="text-slate-700 text-lg leading-relaxed">{t('careers.mission_body')}</p>
      </section>

      <section className="surface-card p-8 max-w-3xl mb-12">
        <h2 className="text-xl font-heading font-bold text-slate-900 mb-3">
          {t('careers.openings_title')}
        </h2>
        <p className="text-slate-700 mb-4">{t('careers.openings_body')}</p>
        <a
          href={`mailto:careers@overglowtrip.com?subject=${encodeURIComponent(t('careers.email_subject'))}`}
          className="btn-primary inline-flex"
        >
          {t('careers.apply_cta')}
        </a>
      </section>

      <section className="surface-card p-8 max-w-3xl">
        <h2 className="text-xl font-heading font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Sparkles size={20} className="text-secondary-500" /> {t('careers.culture_title')}
        </h2>
        <ul className="space-y-2 text-slate-700 list-disc ps-5">
          {(Array.isArray(culture) ? culture : []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </StaticContentPage>
  );
};

export default CareersPage;
