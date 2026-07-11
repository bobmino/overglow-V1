import React from 'react';
import { Link } from 'react-router-dom';
import { Search, CalendarCheck, CreditCard, Compass } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Explorez',
    text: 'Parcourez le catalogue d’expériences authentiques au Maroc : villes, catégories, dates et filtres skip-the-line.',
  },
  {
    icon: CalendarCheck,
    title: 'Réservez',
    text: 'Choisissez un créneau disponible, le nombre de voyageurs, puis confirmez vos coordonnées.',
  },
  {
    icon: CreditCard,
    title: 'Payez en sécurité',
    text: 'Carte (Stripe / PayPal) pour une confirmation automatique, ou virement / espèces avec validation Overglow.',
  },
  {
    icon: Compass,
    title: 'Vivez l’expérience',
    text: 'Recevez votre confirmation, contactez votre opérateur si besoin, et profitez de votre activité.',
  },
];

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
            Comment ça marche
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Overglow Trip connecte voyageurs et opérateurs locaux pour réserver des expériences touristiques en quelques minutes.
          </p>
        </div>

        <div className="space-y-8 mb-14">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <div
              key={title}
              className="flex gap-6 items-start bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="text-primary-600" size={22} />
                  <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                </div>
                <p className="text-gray-600 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/search"
            className="inline-flex justify-center px-8 py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700"
          >
            Voir les expériences
          </Link>
          <Link
            to="/partners/signup"
            className="inline-flex justify-center px-8 py-3 rounded-lg border border-primary-600 text-primary-700 font-semibold hover:bg-primary-50"
          >
            Devenir partenaire
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
