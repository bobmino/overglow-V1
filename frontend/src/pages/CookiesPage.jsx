import React from 'react';
import { Cookie, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LocalizedLink from '../components/LocalizedLink';
import StaticContentPage from '../components/StaticContentPage';

const CookiesPage = () => {
  const { t } = useTranslation();
  const categories = [
    {
      id: 'essential',
      title: t('cookies.cat_essential_title', 'Essentiels'),
      desc: t(
        'cookies.cat_essential_desc',
        'Session, authentification, sécurité et panier. Indispensables au fonctionnement du site.'
      ),
    },
    {
      id: 'analytics',
      title: t('cookies.cat_analytics_title', 'Analytique'),
      desc: t(
        'cookies.cat_analytics_desc',
        'Mesure d’audience (ex. GA4) pour améliorer les parcours. Désactivables via le bandeau de consentement.'
      ),
    },
    {
      id: 'marketing',
      title: t('cookies.cat_marketing_title', 'Marketing'),
      desc: t(
        'cookies.cat_marketing_desc',
        'Mesure de campagnes et retargeting éventuel. Non utilisés sans consentement.'
      ),
    },
  ];

  return (
    <StaticContentPage
      title={t('cookies.title', 'Cookies')}
      subtitle={t(
        'cookies.subtitle',
        'Comment Overglow Trip utilise les cookies et technologies similaires.'
      )}
      metaDescription={t(
        'cookies.meta',
        'Politique cookies Overglow Trip : essentiels, analytics, marketing.'
      )}
      icon={Cookie}
      breadcrumbs={[{ label: t('cookies.title', 'Cookies') }]}
    >
      <div className="max-w-3xl space-y-8">
        <p className="text-slate-700 text-lg leading-relaxed">
          {t(
            'cookies.intro',
            'Les cookies sont de petits fichiers stockés sur votre appareil. Ils permettent de mémoriser vos préférences, sécuriser la connexion et comprendre l’usage du site.'
          )}
        </p>

        <div className="space-y-4">
          {categories.map((c) => (
            <section key={c.id} className="surface-card p-6">
              <h2 className="font-heading font-bold text-lg text-slate-900 mb-2">{c.title}</h2>
              <p className="text-slate-700">{c.desc}</p>
            </section>
          ))}
        </div>

        <section className="surface-card p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-start gap-3">
            <Settings className="text-primary-600 shrink-0 mt-0.5" size={22} />
            <div>
              <h2 className="font-heading font-bold text-slate-900">
                {t('cookies.manage_title', 'Gérer le consentement')}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {t(
                  'cookies.manage_body',
                  'Vous pouvez aussi purger les cookies depuis les paramètres de votre navigateur.'
                )}
              </p>
            </div>
          </div>
          <LocalizedLink to="/cookie-consent" className="btn-primary shrink-0">
            {t('cookies.manage_cta', 'Préférences cookies')}
          </LocalizedLink>
        </section>

        <p className="text-sm text-slate-500">
          {t('cookies.see_also', 'Voir aussi notre')}{' '}
          <LocalizedLink to="/privacy" className="text-primary-700 font-semibold hover:underline">
            {t('cookies.privacy_link', 'politique de confidentialité')}
          </LocalizedLink>
          .
        </p>
      </div>
    </StaticContentPage>
  );
};

export default CookiesPage;
