import React from 'react';
import { Users, Instagram, Facebook, Star } from 'lucide-react';
import StaticContentPage from '../components/StaticContentPage';

const STORIES = [
  {
    name: 'Atelier poterie — Fès',
    quote: 'Passer sur Overglow nous a apporté des voyageurs déjà engagés, avec moins de no-shows.',
  },
  {
    name: 'Randonnée Haut Atlas',
    quote: 'Les réservations confirmées et le chat intégré simplifient vraiment le suivi client.',
  },
];

const OperatorCommunityPage = () => (
  <StaticContentPage
    title="Communauté opérateurs"
    subtitle="Échangez avec d’autres partenaires et suivez nos actualités."
    metaDescription="Communauté opérateurs Overglow Trip : forum, réseaux sociaux, success stories."
    icon={Users}
    breadcrumbs={[{ label: 'Opérateur' }, { label: 'Communauté' }]}
  >
    <div className="max-w-4xl space-y-10">
      <section className="surface-card p-8 text-center">
        <h2 className="text-xl font-heading font-bold mb-2">Forum opérateurs</h2>
        <p className="text-slate-600 mb-4">
          Espace d’échange entre partenaires — bientôt disponible.
        </p>
        <span className="inline-flex px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
          Coming soon
        </span>
      </section>

      <section>
        <h2 className="text-xl font-heading font-bold mb-4">Réseaux sociaux</h2>
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

      <section>
        <h2 className="text-xl font-heading font-bold mb-4 flex items-center gap-2">
          <Star className="text-amber-500" size={22} /> Success stories
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {STORIES.map((s) => (
            <blockquote key={s.name} className="surface-card p-6">
              <p className="text-slate-700 italic mb-3">“{s.quote}”</p>
              <footer className="text-sm font-semibold text-primary-700">{s.name}</footer>
            </blockquote>
          ))}
        </div>
      </section>
    </div>
  </StaticContentPage>
);

export default OperatorCommunityPage;
