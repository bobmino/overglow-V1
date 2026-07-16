import React from 'react';
import LocalizedLink from '../components/LocalizedLink';
import { Shield, Phone, HeartPulse, LifeBuoy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StaticContentPage from '../components/StaticContentPage';
import SEOHead from '../components/SEOHead';

const SafetyPage = () => {
  const { t } = useTranslation();
  const tips = t('safety.tips', { returnObjects: true, defaultValue: [] });
  const emergencies = t('safety.emergencies', { returnObjects: true, defaultValue: [] });

  return (
    <StaticContentPage
      title={t('safety.title')}
      subtitle={t('safety.subtitle')}
      metaDescription={t('safety.meta')}
      icon={Shield}
      breadcrumbs={[{ label: t('safety.title') }]}
    >
      <SEOHead title={t('safety.title')} description={t('safety.meta')} pathname="/safety" />
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl">
        <section className="surface-card p-6 md:p-8">
          <h2 className="text-xl font-heading font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Shield size={20} className="text-primary-600" /> {t('safety.tips_title')}
          </h2>
          <ul className="space-y-3 text-slate-700 list-disc ps-5">
            {(Array.isArray(tips) ? tips : []).map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-6 md:p-8">
          <h2 className="text-xl font-heading font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Phone size={20} className="text-primary-600" /> {t('safety.emergency_title')}
          </h2>
          <ul className="space-y-2 text-slate-700">
            {(Array.isArray(emergencies) ? emergencies : []).map((row) => (
              <li key={row}>
                <strong>{row.split(':')[0]}:</strong>
                {row.includes(':') ? row.slice(row.indexOf(':') + 1) : ''}
              </li>
            ))}
          </ul>
          <p className="text-sm text-slate-500 mt-4">{t('safety.emergency_note')}</p>
        </section>

        <section className="surface-card p-6 md:p-8">
          <h2 className="text-xl font-heading font-bold text-slate-900 mb-4 flex items-center gap-2">
            <HeartPulse size={20} className="text-primary-600" /> {t('safety.insurance_title')}
          </h2>
          <p className="text-slate-700 mb-3">{t('safety.insurance_body')}</p>
          <p className="text-slate-700">{t('safety.insurance_cancel')}</p>
        </section>

        <section className="surface-card p-6 md:p-8">
          <h2 className="text-xl font-heading font-bold text-slate-900 mb-4 flex items-center gap-2">
            <LifeBuoy size={20} className="text-primary-600" /> {t('safety.support_title')}
          </h2>
          <p className="text-slate-700 mb-4">{t('safety.support_body')}</p>
          <LocalizedLink to="/help" className="btn-primary inline-flex">
            {t('safety.support_cta')}
          </LocalizedLink>
        </section>
      </div>
    </StaticContentPage>
  );
};

export default SafetyPage;
