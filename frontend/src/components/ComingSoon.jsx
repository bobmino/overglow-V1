import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowLeft } from 'lucide-react';

const ComingSoon = ({ title = "Bientôt disponible" }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 max-w-lg w-full text-center relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-0 start-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400"></div>
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
          <Sparkles size={40} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-4">{title}</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Nous travaillons activement sur cette page pour vous offrir une expérience toujours plus exceptionnelle. Restez à l'écoute !
        </p>
        
        <Link 
          to="/"
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
        >
          <ArrowLeft size={18} />
          {t('common.home', 'Retour à l\'accueil')}
        </Link>
      </div>
    </div>
  );
};

export default ComingSoon;
