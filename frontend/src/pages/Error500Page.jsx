import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../components/SEOHead';

const Error500Page = ({ onRetry }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <SEOHead title={t('errors.500_title')} noIndex />
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <AlertCircle size={32} className="text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('errors.500_title')}</h1>
        <p className="text-slate-600 mb-6">{t('errors.500_body')}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onRetry || (() => window.location.reload())}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
          >
            <RefreshCw size={18} />
            {t('errors.reload')}
          </button>
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-800 rounded-lg font-semibold hover:bg-slate-200 transition"
          >
            <Home size={18} />
            {t('errors.home')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Error500Page;
