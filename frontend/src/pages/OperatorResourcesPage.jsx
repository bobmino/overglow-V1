import React from 'react';
import { Camera, BadgeDollarSign, PenLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StaticContentPage from '../components/StaticContentPage';

const OperatorResourcesPage = () => {
  const { t } = useTranslation();

  return (
    <StaticContentPage
      title={t('operator.resources.title', 'Ressources opérateur')}
      subtitle={t(
        'operator.resources.subtitle',
        'Conseils pour photographier, tarifer et décrire vos expériences.'
      )}
      metaDescription={t(
        'operator.resources.meta',
        'Guides opérateurs Overglow : photos, prix, descriptions.'
      )}
      icon={Camera}
      breadcrumbs={[
        { label: t('operator.resources.crumb_operator', 'Opérateur') },
        { label: t('operator.resources.crumb_resources', 'Ressources') },
      ]}
    >
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl">
        <article className="surface-card p-6">
          <Camera className="text-primary-600 mb-3" size={28} />
          <h2 className="font-heading font-bold text-lg mb-2">
            {t('operator.resources.photos_title', 'Photographie')}
          </h2>
          <ul className="text-sm text-slate-700 space-y-2 list-disc ps-4">
            <li>{t('operator.resources.photos_1', 'Lumière naturelle, horaires dorés.')}</li>
            <li>
              {t(
                'operator.resources.photos_2',
                'Montrez les personnes / l’ambiance, pas seulement le lieu.'
              )}
            </li>
            <li>
              {t(
                'operator.resources.photos_3',
                'Ratio paysage, fichiers WebP/JPEG nets (min. 1200px).'
              )}
            </li>
            <li>
              {t(
                'operator.resources.photos_4',
                'Évitez les logos surimpressions et watermarks lourds.'
              )}
            </li>
          </ul>
        </article>
        <article className="surface-card p-6">
          <BadgeDollarSign className="text-primary-600 mb-3" size={28} />
          <h2 className="font-heading font-bold text-lg mb-2">
            {t('operator.resources.pricing_title', 'Tarification')}
          </h2>
          <ul className="text-sm text-slate-700 space-y-2 list-disc ps-4">
            <li>
              {t(
                'operator.resources.pricing_1',
                'Comparez des expériences similaires sur la plateforme.'
              )}
            </li>
            <li>
              {t(
                'operator.resources.pricing_2',
                'Incluez clairement ce qui est compris (transferts, repas…).'
              )}
            </li>
            <li>
              {t(
                'operator.resources.pricing_3',
                'Testez une promo courte plutôt qu’un prix trop bas permanent.'
              )}
            </li>
            <li>
              {t(
                'operator.resources.pricing_4',
                'Anticipez la commission plateforme dans votre marge.'
              )}
            </li>
          </ul>
        </article>
        <article className="surface-card p-6">
          <PenLine className="text-primary-600 mb-3" size={28} />
          <h2 className="font-heading font-bold text-lg mb-2">
            {t('operator.resources.desc_title', 'Descriptions')}
          </h2>
          <ul className="text-sm text-slate-700 space-y-2 list-disc ps-4">
            <li>
              {t(
                'operator.resources.desc_1',
                'Accroche en 1 phrase, puis déroulé concret de l’expérience.'
              )}
            </li>
            <li>
              {t(
                'operator.resources.desc_2',
                'Précisez durée, point de rendez-vous, langue, niveau.'
              )}
            </li>
            <li>
              {t(
                'operator.resources.desc_3',
                'Listez inclusions / exclusions pour limiter les questions.'
              )}
            </li>
            <li>
              {t(
                'operator.resources.desc_4',
                'Écrivez en français clair ; ajoutez EN si votre clientèle l’exige.'
              )}
            </li>
          </ul>
        </article>
      </div>
    </StaticContentPage>
  );
};

export default OperatorResourcesPage;
