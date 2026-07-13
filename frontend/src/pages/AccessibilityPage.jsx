import React from 'react';
import { Accessibility, Keyboard, Eye, Mail } from 'lucide-react';
import StaticContentPage from '../components/StaticContentPage';

const AccessibilityPage = () => (
  <StaticContentPage
    title="Accessibilité"
    subtitle="Notre engagement pour un site utilisable par le plus grand nombre."
    metaDescription="Déclaration d’accessibilité Overglow Trip : navigation clavier, lecteurs d’écran, contraste."
    icon={Accessibility}
    breadcrumbs={[{ label: 'Accessibilité' }]}
  >
    <div className="max-w-3xl space-y-8">
      <section className="surface-card p-6 md:p-8">
        <h2 className="text-xl font-heading font-bold mb-3">Déclaration</h2>
        <p className="text-slate-700 leading-relaxed">
          Overglow Trip s’efforce de respecter les bonnes pratiques WCAG 2.1 niveau AA.
          Certaines pages ou contenus tiers peuvent encore présenter des écarts ; nous
          corrigeons en continu.
        </p>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <div className="surface-card p-5">
          <Keyboard className="text-primary-600 mb-2" size={22} />
          <h3 className="font-bold text-slate-900 mb-1">Navigation clavier</h3>
          <p className="text-sm text-slate-600">
            Parcours des liens et boutons au Tab, actions via Entrée / Espace.
          </p>
        </div>
        <div className="surface-card p-5">
          <Eye className="text-primary-600 mb-2" size={22} />
          <h3 className="font-bold text-slate-900 mb-1">Contraste & lecture</h3>
          <p className="text-sm text-slate-600">
            Textes lisibles, labels sur formulaires, support des lecteurs d’écran en cours d’amélioration.
          </p>
        </div>
      </section>

      <section className="surface-card p-6">
        <h2 className="text-xl font-heading font-bold mb-2 flex items-center gap-2">
          <Mail size={20} className="text-primary-600" /> Signaler un problème
        </h2>
        <p className="text-slate-700 mb-3">
          Décrivez la page concernée et l’outil d’assistance utilisé :
        </p>
        <a
          href="mailto:accessibility@overglowtrip.com?subject=Accessibilité%20Overglow"
          className="btn-primary"
        >
          Contacter l’équipe accessibilité
        </a>
      </section>
    </div>
  </StaticContentPage>
);

export default AccessibilityPage;
