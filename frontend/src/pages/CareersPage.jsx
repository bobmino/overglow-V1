import React from 'react';
import { Briefcase, Heart, Sparkles } from 'lucide-react';
import StaticContentPage from '../components/StaticContentPage';

const JOBS = [
  {
    title: 'Développeur Full-Stack',
    type: 'CDI · Remote / Casablanca',
    desc: 'Construire la marketplace MERN/Next, APIs et expériences voyageur.',
  },
  {
    title: 'Chef de Produit',
    type: 'CDI · Hybride',
    desc: 'Prioriser la roadmap, animer discovery et livrer des parcours conversion.',
  },
  {
    title: 'Community Manager',
    type: 'CDI / Freelance · Maroc',
    desc: 'Animer la communauté opérateurs et voyageurs, contenus et partenariats.',
  },
];

const CareersPage = () => (
  <StaticContentPage
    title="Carrières"
    subtitle="Rejoignez Overglow Trip pour rendre le tourisme marocain plus authentique et accessible."
    metaDescription="Offres d’emploi Overglow Trip : développeur, produit, community. Postulez par e-mail."
    icon={Briefcase}
    breadcrumbs={[{ label: 'Carrières' }]}
  >
    <section className="max-w-3xl mb-12">
      <h2 className="text-2xl font-heading font-bold text-slate-900 mb-3 flex items-center gap-2">
        <Heart size={22} className="text-primary-600" /> Notre mission
      </h2>
      <p className="text-slate-700 text-lg leading-relaxed">
        Nous connectons voyageurs et opérateurs locaux pour des expériences vérifiées,
        équitables et mémorables. Notre équipe est petite, ambitieuse et orientée impact.
      </p>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-heading font-bold text-slate-900 mb-6">Postes ouverts</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {JOBS.map((job) => (
          <article key={job.title} className="surface-card p-6 flex flex-col">
            <h3 className="font-heading font-bold text-lg text-slate-900 mb-1">{job.title}</h3>
            <p className="text-sm text-primary-700 font-semibold mb-3">{job.type}</p>
            <p className="text-slate-600 text-sm flex-1 mb-4">{job.desc}</p>
            <a
              href={`mailto:careers@overglowtrip.com?subject=${encodeURIComponent(`Candidature — ${job.title}`)}`}
              className="btn-primary w-full"
            >
              Postuler
            </a>
          </article>
        ))}
      </div>
    </section>

    <section className="surface-card p-8 max-w-3xl">
      <h2 className="text-xl font-heading font-bold text-slate-900 mb-3 flex items-center gap-2">
        <Sparkles size={20} className="text-amber-500" /> Culture
      </h2>
      <ul className="space-y-2 text-slate-700 list-disc ps-5">
        <li>Autonomie et ownership sur les livrables.</li>
        <li>Respect des opérateurs locaux et de l’authenticité des expériences.</li>
        <li>Feedback direct, rituels légers, focus qualité produit.</li>
        <li>Candidatures spontanées : careers@overglowtrip.com</li>
      </ul>
    </section>
  </StaticContentPage>
);

export default CareersPage;
