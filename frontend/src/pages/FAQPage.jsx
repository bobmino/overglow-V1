import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import FAQSection from '../components/FAQSection';

const FAQPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <HelpCircle className="mx-auto h-14 w-14 text-primary-600 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-3">FAQ</h1>
          <p className="text-gray-600">
            Réponses aux questions les plus fréquentes.{' '}
            <Link to="/help" className="text-primary-600 font-semibold hover:underline">
              Centre d&apos;aide complet
            </Link>
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8">
          <FAQSection language="fr" limit={50} />
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
