import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Mail, MessageSquare } from 'lucide-react';
import FAQSection from '../components/FAQSection';
import ChatWidget from '../components/ChatWidget';

const HelpPage = () => {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <HelpCircle className="mx-auto h-16 w-16 text-primary-600 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Centre d'aide</h1>
          <p className="text-xl text-gray-600">Comment pouvons-nous vous aider ?</p>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
          <FAQSection language="fr" limit={20} />
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Guides rapides</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200 rounded-lg hover:border-primary-500 transition">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pour les voyageurs</h3>
              <ul className="space-y-2 text-gray-600">
                <li><Link to="/help/booking" className="hover:text-primary-600">Comment réserver</Link></li>
                <li><Link to="/help/cancellation" className="hover:text-primary-600">Annuler une réservation</Link></li>
                <li><Link to="/help/payment" className="hover:text-primary-600">Modes de paiement</Link></li>
                <li><Link to="/help/account" className="hover:text-primary-600">Gérer mon compte</Link></li>
              </ul>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg hover:border-primary-500 transition">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pour les opérateurs</h3>
              <ul className="space-y-2 text-gray-600">
                <li><Link to="/help/operator/getting-started" className="hover:text-primary-600">Commencer</Link></li>
                <li><Link to="/help/operator/products" className="hover:text-primary-600">Gérer mes produits</Link></li>
                <li><Link to="/help/operator/bookings" className="hover:text-primary-600">Gérer les réservations</Link></li>
                <li><Link to="/help/operator/payments" className="hover:text-primary-600">Paiements et retraits</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Besoin d'aide supplémentaire ?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-6 border border-gray-200 rounded-lg">
              <Mail className="text-primary-600 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Contactez-nous</h3>
                <p className="text-gray-600 mb-4">Envoyez-nous un email et nous vous répondrons dans les 24 heures.</p>
                <Link to="/contact" className="text-primary-600 font-semibold hover:underline">
                  Envoyer un email →
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 border border-gray-200 rounded-lg">
              <MessageSquare className="text-primary-600 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Chat en direct</h3>
                <p className="text-gray-600 mb-4">Discutez avec notre équipe de support en temps réel.</p>
                <button 
                  onClick={() => setShowChat(true)}
                  className="text-primary-600 font-semibold hover:underline"
                >
                  Démarrer le chat →
                </button>
              </div>
            </div>
          </div>
        </div>

        {showChat && (
          <ChatWidget
            onClose={() => setShowChat(false)}
          />
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;

