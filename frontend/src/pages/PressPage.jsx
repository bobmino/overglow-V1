import React from 'react';
import { Newspaper, Download, Mail } from 'lucide-react';
import StaticContentPage from '../components/StaticContentPage';

const MENTIONS = [
  {
    outlet: 'Tourisme Maroc Mag',
    title: 'Overglow Trip mise sur l’expérience locale vérifiée',
    date: '2025',
  },
  {
    outlet: 'Startup Scene',
    title: 'Une marketplace pour réserver autrement au Maroc',
    date: '2025',
  },
  {
    outlet: 'Digital Travel Brief',
    title: 'Paiements locaux et opérateurs indépendants au cœur du produit',
    date: '2024',
  },
];

const PressPage = () => (
  <StaticContentPage
    title="Presse"
    subtitle="Ressources médias, logos et contact pour la presse."
    metaDescription="Kit presse Overglow Trip, logos et contact média."
    icon={Newspaper}
    breadcrumbs={[{ label: 'Presse' }]}
  >
    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mb-12">
      <section className="surface-card p-6 md:p-8">
        <h2 className="text-xl font-heading font-bold mb-3 flex items-center gap-2">
          <Download size={20} className="text-primary-600" /> Kit presse
        </h2>
        <p className="text-slate-700 mb-4">
          Fact sheet, captures produit et éléments de langage pour vos articles.
        </p>
        <a
          href="mailto:press@overglowtrip.com?subject=Demande%20kit%20presse"
          className="btn-primary"
        >
          Demander le kit presse
        </a>
      </section>

      <section className="surface-card p-6 md:p-8">
        <h2 className="text-xl font-heading font-bold mb-3">Logos</h2>
        <p className="text-slate-700 mb-4">
          Logo principal et variantes claires / sombres. Usage non commercial presse autorisé
          avec crédit « Overglow Trip ».
        </p>
        <a href="/vite.svg" download className="btn-secondary">
          Télécharger le logo (SVG)
        </a>
      </section>
    </div>

    <section className="mb-12 max-w-5xl">
      <h2 className="text-2xl font-heading font-bold mb-6">Mentions récentes</h2>
      <ul className="space-y-4">
        {MENTIONS.map((m) => (
          <li key={m.title} className="surface-card p-5">
            <p className="text-sm font-semibold text-primary-700">{m.outlet} · {m.date}</p>
            <p className="text-slate-900 font-medium mt-1">{m.title}</p>
          </li>
        ))}
      </ul>
    </section>

    <section className="surface-card p-6 max-w-xl">
      <h2 className="text-xl font-heading font-bold mb-2 flex items-center gap-2">
        <Mail size={20} className="text-primary-600" /> Contact média
      </h2>
      <p className="text-slate-700 mb-3">
        Interviews, partenariats éditoriaux et demandes d’images :
      </p>
      <a href="mailto:press@overglowtrip.com" className="text-primary-700 font-semibold hover:underline">
        press@overglowtrip.com
      </a>
    </section>
  </StaticContentPage>
);

export default PressPage;
