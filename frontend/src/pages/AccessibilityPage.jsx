import React from 'react';
import { Accessibility, Keyboard, Eye, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StaticContentPage from '../components/StaticContentPage';

const AccessibilityPage = () => {
  const { t } = useTranslation();

  return (
    <StaticContentPage
      title={t('accessibility.title', 'Accessibilité')}
      subtitle={t(
        'accessibility.subtitle',
        'Notre engagement pour un site utilisable par le plus grand nombre.'
      )}
      metaDescription={t(
        'accessibility.meta',
        'Déclaration d’accessibilité Overglow Trip : navigation clavier, lecteurs d’écran, contraste.'
      )}
      icon={Accessibility}
      breadcrumbs={[{ label: t('accessibility.title', 'Accessibilité') }]}
    >
      <div className="max-w-3xl space-y-8">
        <section className="surface-card p-6 md:p-8">
          <h2 className="text-xl font-heading font-bold mb-3">
            {t('accessibility.declaration_title', 'Déclaration')}
          </h2>
          <p className="text-slate-700 leading-relaxed">
            {t(
              'accessibility.declaration_body',
              'Overglow Trip s’efforce de respecter les bonnes pratiques WCAG 2.1 niveau AA. Certaines pages ou contenus tiers peuvent encore présenter des écarts ; nous corrigeons en continu.'
            )}
          </p>
        </section>

        <section className="grid sm:grid-cols-2 gap-4">
          <div className="surface-card p-5">
            <Keyboard className="text-primary-600 mb-2" size={22} />
            <h3 className="font-bold text-slate-900 mb-1">
              {t('accessibility.keyboard_title', 'Navigation clavier')}
            </h3>
            <p className="text-sm text-slate-600">
              {t(
                'accessibility.keyboard_body',
                'Parcours des liens et boutons au Tab, actions via Entrée / Espace.'
              )}
            </p>
          </div>
          <div className="surface-card p-5">
            <Eye className="text-primary-600 mb-2" size={22} />
            <h3 className="font-bold text-slate-900 mb-1">
              {t('accessibility.contrast_title', 'Contraste & lecture')}
            </h3>
            <p className="text-sm text-slate-600">
              {t(
                'accessibility.contrast_body',
                'Textes lisibles, labels sur formulaires, support des lecteurs d’écran en cours d’amélioration.'
              )}
            </p>
          </div>
        </section>

        <section className="surface-card p-6">
          <h2 className="text-xl font-heading font-bold mb-2 flex items-center gap-2">
            <Mail size={20} className="text-primary-600" />{' '}
            {t('accessibility.report_title', 'Signaler un problème')}
          </h2>
          <p className="text-slate-700 mb-3">
            {t(
              'accessibility.report_body',
              'Décrivez la page concernée et l’outil d’assistance utilisé :'
            )}
          </p>
          <a
            href="mailto:accessibility@overglowtrip.com?subject=Accessibilit%C3%A9%20Overglow"
            className="btn-primary"
          >
            {t('accessibility.report_cta', 'Contacter l’équipe accessibilité')}
          </a>
        </section>
      </div>
    </StaticContentPage>
  );
};

export default AccessibilityPage;
