import React from 'react';
import { Cookie, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import StaticContentPage from '../components/StaticContentPage';

const CATEGORIES = [
  {
    id: 'essential',
    title: 'Essentiels',
    desc: 'Session, authentification, sécurité et panier. Indispensables au fonctionnement du site.',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    desc: 'Mesure d’audience (ex. GA4) pour améliorer les parcours. Désactivables via vos préférences navigateur / consentement.',
  },
  {
    id: 'marketing',
    title: 'Marketing',
    desc: 'Mesure de campagnes et retargeting éventuel. Non utilisés sans consentement lorsque le bandeau cookies est actif.',
  },
];

const CookiesPage = () => (
  <StaticContentPage
    title="Cookies"
    subtitle="Comment Overglow Trip utilise les cookies et technologies similaires."
    metaDescription="Politique cookies Overglow Trip : essentiels, analytics, marketing."
    icon={Cookie}
    breadcrumbs={[{ label: 'Cookies' }]}
  >
    <div className="max-w-3xl space-y-8">
      <p className="text-slate-700 text-lg leading-relaxed">
        Les cookies sont de petits fichiers stockés sur votre appareil. Ils permettent de
        mémoriser vos préférences, sécuriser la connexion et comprendre l’usage du site.
      </p>

      <div className="space-y-4">
        {CATEGORIES.map((c) => (
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
            <h2 className="font-heading font-bold text-slate-900">Gérer le consentement</h2>
            <p className="text-sm text-slate-600 mt-1">
              Vous pouvez aussi purger les cookies depuis les paramètres de votre navigateur.
            </p>
          </div>
        </div>
        <Link to="/cookie-consent" className="btn-primary shrink-0">
          Préférences cookies
        </Link>
      </section>

      <p className="text-sm text-slate-500">
        Voir aussi notre{' '}
        <Link to="/privacy" className="text-primary-700 font-semibold hover:underline">
          politique de confidentialité
        </Link>
        .
      </p>
    </div>
  </StaticContentPage>
);

export default CookiesPage;
