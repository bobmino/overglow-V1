import React from 'react';
import { Link } from 'react-router-dom';
import LocalizedLink from '../components/LocalizedLink';
import { Shield, Phone, HeartPulse, LifeBuoy } from 'lucide-react';
import StaticContentPage from '../components/StaticContentPage';

const SafetyPage = () => (
  <StaticContentPage
    title="Sécurité voyage"
    subtitle="Conseils pratiques pour voyager sereinement au Maroc avec Overglow Trip."
    metaDescription="Sécurité voyage au Maroc : conseils, numéros d’urgence, assurance et support Overglow."
    icon={Shield}
    breadcrumbs={[{ label: 'Sécurité' }]}
  >
    <div className="grid md:grid-cols-2 gap-8 max-w-5xl">
      <section className="surface-card p-6 md:p-8">
        <h2 className="text-xl font-heading font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Shield size={20} className="text-primary-600" /> Conseils de voyage
        </h2>
        <ul className="space-y-3 text-slate-700 list-disc ps-5">
          <li>Gardez une copie numérique de vos documents (passeport, billets).</li>
          <li>Privilégiez les transports et activités réservés via la plateforme.</li>
          <li>Respectez les consignes locales et les horaires de vos expériences.</li>
          <li>Partagez votre itinéraire avec un proche et restez joignable.</li>
          <li>Hydratez-vous, surtout en été et lors d’activités outdoor.</li>
        </ul>
      </section>

      <section className="surface-card p-6 md:p-8">
        <h2 className="text-xl font-heading font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Phone size={20} className="text-primary-600" /> Numéros d’urgence (Maroc)
        </h2>
        <ul className="space-y-2 text-slate-700">
          <li><strong>Police :</strong> 19 ou 190</li>
          <li><strong>Pompiers :</strong> 15</li>
          <li><strong>SAMU / urgences médicales :</strong> 15</li>
          <li><strong>Gendarmerie :</strong> 177</li>
          <li><strong>Assistance routière :</strong> 5050</li>
        </ul>
        <p className="text-sm text-slate-500 mt-4">
          Depuis un mobile étranger, composez le préfixe international +212 si nécessaire.
        </p>
      </section>

      <section className="surface-card p-6 md:p-8">
        <h2 className="text-xl font-heading font-bold text-slate-900 mb-4 flex items-center gap-2">
          <HeartPulse size={20} className="text-primary-600" /> Assurance
        </h2>
        <p className="text-slate-700 mb-3">
          Nous recommandons une assurance voyage couvrant santé, rapatriement et annulation.
          Vérifiez que vos activités (randonnée, désert, mer) sont incluses.
        </p>
        <p className="text-slate-700">
          En cas d’annulation d’activité selon la politique du produit, le remboursement suit
          les conditions affichées au checkout.
        </p>
      </section>

      <section className="surface-card p-6 md:p-8">
        <h2 className="text-xl font-heading font-bold text-slate-900 mb-4 flex items-center gap-2">
          <LifeBuoy size={20} className="text-primary-600" /> Support Overglow
        </h2>
        <p className="text-slate-700 mb-4">
          Notre équipe vous accompagne avant, pendant et après votre expérience.
        </p>
        <div className="flex flex-wrap gap-3">
          <LocalizedLink to="/help" className="btn-primary">
            Centre d’aide
          </LocalizedLink>
          <LocalizedLink to="/faq" className="btn-secondary">
            FAQ
          </LocalizedLink>
        </div>
      </section>
    </div>
  </StaticContentPage>
);

export default SafetyPage;
