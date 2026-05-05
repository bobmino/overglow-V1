import React from 'react';
import { MapPin, ShieldCheck, Clock } from 'lucide-react';

const FeatureItem = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center text-center p-8 bg-white shadow-sm rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
    <div className="mb-4 p-4 bg-emerald-50 rounded-full">
      <Icon size={32} className="text-emerald-600" strokeWidth={1.5} />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </div>
);

const Features = () => {
  const features = [
    {
      icon: MapPin,
      title: "Expertise Locale",
      description: "Basés à Agadir, nous testons chaque activité."
    },
    {
      icon: ShieldCheck,
      title: "Paiement Sécurisé",
      description: "Transactions cryptées et assistance 7j/7."
    },
    {
      icon: Clock,
      title: "Annulation Souple",
      description: "Liberté totale jusqu'à 24h avant le départ."
    }
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">Nos Promesses</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureItem key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
