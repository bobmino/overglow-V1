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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('help.title')}</h1>
          <p className="text-xl text-gray-600">{t('help.subtitle')}</p>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-100 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="text-emerald-700" />
            <h2 className="text-xl font-bold text-slate-900">{t('help.guarantees_title')}</h2>
          </div>
          <p className="text-slate-700 text-sm">{t('help.guarantees_body')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">{t('help.travelers_title')}</h2>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li>
                <strong>{t('help.travelers_1_label')}:</strong> {t('help.travelers_1')}
              </li>
              <li>
                <strong>{t('help.travelers_2_label')}:</strong> {t('help.travelers_2')}
              </li>
              <li>
                <strong>{t('help.travelers_3_label')}:</strong> {t('help.travelers_3')}
              </li>
              <li>
                <strong>{t('help.travelers_4_label')}:</strong> {t('help.travelers_4')}
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-2 mb-4">
              <HandCoins className="text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">{t('help.partners_title')}</h2>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li>
                <strong>{t('help.partners_1_label')}:</strong> {t('help.partners_1')}
              </li>
              <li>
                <strong>{t('help.partners_2_label')}:</strong> {t('help.partners_2')}
              </li>
              <li>
                <strong>{t('help.partners_3_label')}:</strong> {t('help.partners_3')}
              </li>
              <li>
                <strong>{t('help.partners_4_label')}:</strong> {t('help.partners_4')}
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('help.faq_title')}</h2>
          <FAQSection language={i18n.language?.slice(0, 2) || 'fr'} limit={20} />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('help.more_title')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-6 border border-gray-200 rounded-lg">
              <Mail className="text-primary-600 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">{t('help.contact_title')}</h3>
                <p className="text-gray-600 mb-4">{t('help.contact_body')}</p>
                <Link to="/contact" className="text-primary-600 font-semibold hover:underline">
                  {t('help.contact_cta')}
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 border border-gray-200 rounded-lg">
              <MessageSquare className="text-primary-600 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">{t('help.chat_title')}</h3>
                <p className="text-gray-600 mb-4">{t('help.chat_body')}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (isAuthenticated) {
                      setShowChat(true);
                    } else {
                      navigate('/login', { state: { from: { pathname: '/help' } } });
                    }
                  }}
                  className="text-primary-600 font-semibold hover:underline"
                >
                  {t('help.chat_cta')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {showChat && <ChatWidget onClose={() => setShowChat(false)} />}
      </div>
    </div>
  );
};

export default HelpPage;
