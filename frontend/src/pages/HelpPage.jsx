import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HelpCircle, Mail, MessageSquare, ShieldCheck, HandCoins, Users } from 'lucide-react';
import FAQSection from '../components/FAQSection';
import ChatWidget from '../components/ChatWidget';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const HelpPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <HelpCircle className="mx-auto h-16 w-16 text-primary-600 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Centre d'aide</h1>
          <p className="text-xl text-gray-600">Comment pouvons-nous vous aider ?</p>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-100 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="text-emerald-700" />
            <h2 className="text-xl font-bold text-slate-900">Paiements et support: vos garanties</h2>
          </div>
          <p className="text-slate-700 text-sm">
            Toutes les transactions sont securisees. Notre support client repond 24/7 pour les voyageurs et les partenaires.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Pour les Voyageurs</h2>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li><strong>Paiement securise:</strong> cartes chiffrees et validation anti-fraude.</li>
              <li><strong>Reservation claire:</strong> details, horaires et politique d'annulation visibles avant paiement.</li>
              <li><strong>Support rapide:</strong> assistance par chat et email 24/7.</li>
              <li><strong>Confiance:</strong> experiences verifiees et guides selectionnes.</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-2 mb-4">
              <HandCoins className="text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Pour les Partenaires</h2>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li><strong>Versements fiables:</strong> paiements automatises selon la date de versement.</li>
              <li><strong>Visibilite internationale:</strong> diffusion de vos activites a une audience mondiale.</li>
              <li><strong>Pilotage business:</strong> dashboard reservations, statuts et suivi financier.</li>
              <li><strong>Accompagnement:</strong> equipe dediee pour lancer et optimiser vos offres.</li>
            </ul>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions frequentes</h2>
          <FAQSection language={i18n.language?.slice(0, 2) || 'fr'} limit={20} />
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
                  onClick={() => {
                    if (isAuthenticated) {
                      setShowChat(true);
                    } else {
                      navigate('/login', { state: { from: { pathname: '/help' } } });
                    }
                  }}
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
  );
};

export default HelpPage;

