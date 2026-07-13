import React from 'react';
import { Camera, BadgeDollarSign, PenLine } from 'lucide-react';
import StaticContentPage from '../components/StaticContentPage';

const OperatorResourcesPage = () => (
  <StaticContentPage
    title="Ressources opérateur"
    subtitle="Conseils pour photographier, tarifer et décrire vos expériences."
    metaDescription="Guides opérateurs Overglow : photos, prix, descriptions."
    icon={Camera}
    breadcrumbs={[{ label: 'Opérateur' }, { label: 'Ressources' }]}
  >
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl">
      <article className="surface-card p-6">
        <Camera className="text-primary-600 mb-3" size={28} />
        <h2 className="font-heading font-bold text-lg mb-2">Photographie</h2>
        <ul className="text-sm text-slate-700 space-y-2 list-disc ps-4">
          <li>Lumière naturelle, horaires dorés.</li>
          <li>Montrez les personnes / l’ambiance, pas seulement le lieu.</li>
          <li>Ratio paysage, fichiers WebP/JPEG nets (min. 1200px).</li>
          <li>Évitez les logos surimpressions et watermarks lourds.</li>
        </ul>
      </article>
      <article className="surface-card p-6">
        <BadgeDollarSign className="text-primary-600 mb-3" size={28} />
        <h2 className="font-heading font-bold text-lg mb-2">Tarification</h2>
        <ul className="text-sm text-slate-700 space-y-2 list-disc ps-4">
          <li>Comparez des expériences similaires sur la plateforme.</li>
          <li>Incluez clairement ce qui est compris (transferts, repas…).</li>
          <li>Testez une promo courte plutôt qu’un prix trop bas permanent.</li>
          <li>Anticipez la commission plateforme dans votre marge.</li>
        </ul>
      </article>
      <article className="surface-card p-6">
        <PenLine className="text-primary-600 mb-3" size={28} />
        <h2 className="font-heading font-bold text-lg mb-2">Descriptions</h2>
        <ul className="text-sm text-slate-700 space-y-2 list-disc ps-4">
          <li>Accroche en 1 phrase, puis déroulé concret de l’expérience.</li>
          <li>Précisez durée, point de rendez-vous, langue, niveau.</li>
          <li>Listez inclusions / exclusions pour limiter les questions.</li>
          <li>Écrivez en français clair ; ajoutez EN si votre clientèle l’exige.</li>
        </ul>
      </article>
    </div>
  </StaticContentPage>
);

export default OperatorResourcesPage;
