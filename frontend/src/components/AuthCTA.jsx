import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AuthCTA = () => {
  const { t } = useTranslation();

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="bg-emerald-50 rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto border border-emerald-100 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {t('home.auth_title')}
          </h2>
          <p className="text-gray-600 mb-8">
            {t('home.auth_no_account')}{' '}
            <Link to="/register" className="text-primary-700 font-semibold hover:underline">
              {t('home.auth_signup')}
            </Link>
          </p>
          <Link
            to="/login"
            className="inline-block bg-slate-900 text-white font-bold py-3 px-8 rounded-full hover:bg-slate-800 transition shadow-lg"
          >
            {t('home.auth_login')}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AuthCTA;
