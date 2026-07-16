import React from 'react';
import { MapPin, ShieldCheck, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FeatureItem = ({ icon, title, description }) => (
  <div className="flex flex-col items-center text-center p-8 bg-white shadow-sm rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
    <div className="mb-4 p-4 bg-primary-50 rounded-full">
      {React.createElement(icon, { size: 32, className: 'text-primary-600', strokeWidth: 1.5 })}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </div>
);

const Features = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: MapPin,
      title: t('home.feature_local_title'),
      description: t('home.feature_local_desc'),
    },
    {
      icon: ShieldCheck,
      title: t('home.feature_secure_title'),
      description: t('home.feature_secure_desc'),
    },
    {
      icon: Clock,
      title: t('home.feature_cancel_title'),
      description: t('home.feature_cancel_desc'),
    },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">
          {t('home.features_title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <FeatureItem key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
