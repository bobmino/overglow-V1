import React from 'react';
import { useTranslation } from 'react-i18next';

const FlexibilityBanner = () => {
  const { t } = useTranslation();

  return (
    <section className="py-12 bg-gradient-to-r from-green-50 to-blue-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.flex_title')}</h2>
        <p className="text-gray-700 max-w-2xl mx-auto leading-relaxed">{t('home.flex_text')}</p>
      </div>
    </section>
  );
};

export default FlexibilityBanner;
