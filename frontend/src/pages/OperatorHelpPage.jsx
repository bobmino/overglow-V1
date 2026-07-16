import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { HelpCircle, ChevronDown, BookOpen, MessageSquare, Package, Banknote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LocalizedLink from '../components/LocalizedLink';

const OperatorHelpPage = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(0);

  const faqs = [
    {
      q: t('operator.help.faq1_q', 'Comment publier mon premier produit ?'),
      a: t(
        'operator.help.faq1_a',
        'Allez dans Mes produits → Créer un produit, renseignez les infos, photos et créneaux, puis soumettez pour validation admin.'
      ),
    },
    {
      q: t('operator.help.faq2_q', 'Quand suis-je payé ?'),
      a: t(
        'operator.help.faq2_a',
        'Après réservations confirmées, demandez un retrait depuis Mes revenus. L’admin valide puis marque le virement comme traité.'
      ),
    },
    {
      q: t('operator.help.faq3_q', 'Comment répondre aux avis ?'),
      a: t(
        'operator.help.faq3_a',
        'Sur la fiche produit publique ou via les notifications new_review, utilisez « Répondre » pour publier une réponse opérateur.'
      ),
    },
    {
      q: t('operator.help.faq4_q', 'Que faire si un paiement est en attente ?'),
      a: t(
        'operator.help.faq4_a',
        'Les paiements virement/cash sont validés par l’admin. Contactez le support si un client a déjà payé hors ligne.'
      ),
    },
    {
      q: t('operator.help.faq5_q', 'Comment gérer une annulation ?'),
      a: t(
        'operator.help.faq5_a',
        'La politique d’annulation affichée sur le produit s’applique. En cas de litige, documentez via la messagerie plateforme — l’admin peut arbitrer.'
      ),
    },
    {
      q: t('operator.help.faq6_q', 'Comment améliorer mon classement ?'),
      a: t(
        'operator.help.faq6_a',
        'Photos nettes, description complète, réponses rapides aux messages, avis Approuvés et disponibilité à jour. Les badges se débloquent via les métriques réelles.'
      ),
    },
  ];

  return (
    <div className="page-shell">
      <Helmet>
        <title>{t('operator.help.meta_title', 'Centre d’aide opérateur | Overglow Trip')}</title>
        <meta
          name="description"
          content={t('operator.help.meta_desc', 'FAQ et aide pour les opérateurs Overglow Trip.')}
        />
      </Helmet>
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white pt-28 pb-14">
        <div className="container mx-auto px-4 max-w-3xl">
          <HelpCircle className="mb-4 text-primary-300" size={40} />
          <h1 className="text-4xl font-heading font-bold mb-3">
            {t('operator.help.title', 'Centre d’aide opérateur')}
          </h1>
          <p className="text-slate-300 text-lg">
            {t(
              'operator.help.subtitle',
              'Réponses rapides pour gérer produits, réservations et retraits.'
            )}
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          <LocalizedLink
            to="/operator/products"
            className="surface-card p-4 flex items-center gap-2 hover:border-primary-400 transition"
          >
            <Package className="text-primary-600 shrink-0" size={20} />
            <span className="text-sm font-semibold text-slate-900">
              {t('operator.help.quick_products', 'Mes produits')}
            </span>
          </LocalizedLink>
          <LocalizedLink
            to="/operator/withdrawals"
            className="surface-card p-4 flex items-center gap-2 hover:border-primary-400 transition"
          >
            <Banknote className="text-primary-600 shrink-0" size={20} />
            <span className="text-sm font-semibold text-slate-900">
              {t('operator.help.quick_revenue', 'Mes revenus')}
            </span>
          </LocalizedLink>
          <LocalizedLink
            to="/operator/resources"
            className="surface-card p-4 flex items-center gap-2 hover:border-primary-400 transition"
          >
            <BookOpen className="text-primary-600 shrink-0" size={20} />
            <span className="text-sm font-semibold text-slate-900">
              {t('operator.help.quick_resources', 'Ressources')}
            </span>
          </LocalizedLink>
        </div>

        <div className="space-y-3 mb-10">
          {faqs.map((item, i) => (
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
          <LocalizedLink
            to="/operator/resources"
            className="surface-card p-5 hover:border-primary-400 transition flex gap-3"
          >
            <BookOpen className="text-primary-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900">
                {t('operator.help.doc_title', 'Documentation')}
              </p>
              <p className="text-sm text-slate-600">
                {t('operator.help.doc_body', 'Guides photos, tarifs et descriptions')}
              </p>
            </div>
          </LocalizedLink>
          <LocalizedLink
            to="/operator/inquiries"
            className="surface-card p-5 hover:border-primary-400 transition flex gap-3"
          >
            <MessageSquare className="text-primary-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900">
                {t('operator.help.support_title', 'Contacter le support')}
              </p>
              <p className="text-sm text-slate-600">
                {t('operator.help.support_body', 'Messages & chat depuis votre espace')}
              </p>
            </div>
          </LocalizedLink>
        </div>
      </div>
    </div>
  );
};

export default OperatorHelpPage;
