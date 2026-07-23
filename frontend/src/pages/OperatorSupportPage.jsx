import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Headphones, MessageSquare } from 'lucide-react';
import ChatWidget from '../components/ChatWidget';

/**
 * Canal dédié opérateur ↔ équipe Overglow (chat type=support).
 * Séparé de /operator/inquiries (messages clients produits).
 */
const OperatorSupportPage = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading flex items-center gap-2">
            <Headphones className="text-primary-700" size={28} />
            {t('operator.support.title', 'Support Overglow')}
          </h1>
          <p className="text-sm text-gray-600 mt-2 max-w-2xl">
            {t(
              'operator.support.subtitle',
              'Échangez avec l’équipe Overglow (onboarding, litiges, aide technique). Les questions clients sur vos produits sont dans Messages clients.'
            )}
          </p>
        </div>
        <Link
          to="/operator/inquiries"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-semibold text-sm hover:bg-slate-50"
        >
          <MessageSquare size={16} />
          {t('operator.support.to_clients', 'Messages clients')}
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[520px] h-[min(70vh,720px)]">
        <ChatWidget embedded onClose={null} />
      </div>
    </div>
  );
};

export default OperatorSupportPage;
