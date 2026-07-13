import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HelpCircle, ChevronDown, BookOpen, MessageSquare } from 'lucide-react';

const FAQS = [
  {
    q: 'Comment publier mon premier produit ?',
    a: 'Allez dans Mes produits → Créer un produit, renseignez les infos, photos et créneaux, puis soumettez pour validation admin.',
  },
  {
    q: 'Quand suis-je payé ?',
    a: 'Après réservations confirmées, demandez un retrait depuis Mes revenus. L’admin valide puis marque le virement comme traité.',
  },
  {
    q: 'Comment répondre aux avis ?',
    a: 'Sur la fiche produit publique ou via les notifications new_review, utilisez « Répondre » pour publier une réponse opérateur.',
  },
  {
    q: 'Que faire si un paiement est en attente ?',
    a: 'Les paiements virement/cash sont validés par l’admin. Contactez le support si un client a déjà payé hors ligne.',
  },
];

const OperatorHelpPage = () => {
  const [open, setOpen] = useState(0);

  return (
    <div className="page-shell">
      <Helmet>
        <title>Centre d’aide opérateur | Overglow Trip</title>
        <meta name="description" content="FAQ et aide pour les opérateurs Overglow Trip." />
      </Helmet>
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white pt-28 pb-14">
        <div className="container mx-auto px-4 max-w-3xl">
          <HelpCircle className="mb-4 text-primary-300" size={40} />
          <h1 className="text-4xl font-heading font-bold mb-3">Centre d’aide opérateur</h1>
          <p className="text-slate-300 text-lg">
            Réponses rapides pour gérer produits, réservations et retraits.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="space-y-3 mb-10">
          {FAQS.map((item, i) => (
            <div key={item.q} className="surface-card overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-start font-semibold text-slate-900"
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
              >
                {item.q}
                <ChevronDown
                  size={18}
                  className={`shrink-0 transition ${open === i ? 'rotate-180' : ''}`}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-slate-600 border-t border-slate-100 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link to="/operator/resources" className="surface-card p-5 hover:border-primary-400 transition flex gap-3">
            <BookOpen className="text-primary-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900">Documentation</p>
              <p className="text-sm text-slate-600">Guides photos, tarifs et descriptions</p>
            </div>
          </Link>
          <Link to="/operator/inquiries" className="surface-card p-5 hover:border-primary-400 transition flex gap-3">
            <MessageSquare className="text-primary-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900">Contacter le support</p>
              <p className="text-sm text-slate-600">Messages & chat depuis votre espace</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OperatorHelpPage;
