import React from 'react';
import { Calendar, DollarSign, Globe, Shield, Utensils, MapPin, Clock, Sun, Users } from 'lucide-react';

const DestinationGuide = ({ city, guide }) => {
  if (!guide) return null;

  return (
    <div className="space-y-6">
      {/* Practical Information */}
      {guide.practicalInfo && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Informations pratiques</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {guide.practicalInfo.bestTime && (
              <div className="flex items-start gap-3">
                <Calendar className="text-primary-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Meilleure période</h4>
                  <p className="text-slate-600 text-sm">{guide.practicalInfo.bestTime}</p>
                </div>
              </div>
            )}
            {guide.practicalInfo.duration && (
              <div className="flex items-start gap-3">
                <Clock className="text-primary-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Durée recommandée</h4>
                  <p className="text-slate-600 text-sm">{guide.practicalInfo.duration}</p>
                </div>
              </div>
            )}
            {guide.practicalInfo.budget && (
              <div className="flex items-start gap-3">
                <DollarSign className="text-primary-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Budget moyen</h4>
                  <p className="text-slate-600 text-sm">{guide.practicalInfo.budget}</p>
                </div>
              </div>
            )}
            {guide.practicalInfo.language && (
              <div className="flex items-start gap-3">
                <Globe className="text-primary-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Langues</h4>
                  <p className="text-slate-600 text-sm">{guide.practicalInfo.language}</p>
                </div>
              </div>
            )}
            {guide.practicalInfo.currency && (
              <div className="flex items-start gap-3">
                <DollarSign className="text-primary-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Monnaie</h4>
                  <p className="text-slate-600 text-sm">{guide.practicalInfo.currency}</p>
                </div>
              </div>
            )}
            {guide.practicalInfo.climate && (
              <div className="flex items-start gap-3">
                <Sun className="text-primary-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Climat</h4>
                  <p className="text-slate-600 text-sm">{guide.practicalInfo.climate}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Travel Tips */}
      {guide.tips && guide.tips.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Conseils de voyage</h3>
          <div className="space-y-3">
            {guide.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-slate-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Getting Around */}
      {guide.gettingAround && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Se déplacer</h3>
          <div className="space-y-3">
            {guide.gettingAround.map((option, index) => (
              <div key={index} className="flex items-start gap-3">
                <MapPin className="text-primary-600 mt-1 flex-shrink-0" size={18} />
                <div>
                  <h4 className="font-semibold text-slate-900">{option.method}</h4>
                  <p className="text-slate-600 text-sm">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Local Culture */}
      {guide.culture && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Culture locale</h3>
          <p className="text-slate-700 leading-relaxed mb-4">{guide.culture.description}</p>
          {guide.culture.traditions && guide.culture.traditions.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-slate-900 mb-2">Traditions à découvrir</h4>
              <ul className="space-y-2">
                {guide.culture.traditions.map((tradition, index) => (
                  <li key={index} className="flex items-start gap-2 text-slate-700">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>{tradition}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Food & Drink */}
      {guide.food && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Utensils size={24} />
            Gastronomie
          </h3>
          <p className="text-slate-700 leading-relaxed mb-4">{guide.food.description}</p>
          {guide.food.specialties && guide.food.specialties.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-slate-900 mb-2">Spécialités à goûter</h4>
              <div className="flex flex-wrap gap-2">
                {guide.food.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Safety Tips */}
      {guide.safety && (
        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
          <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Shield size={24} />
            Sécurité
          </h3>
          <p className="text-slate-700 leading-relaxed mb-4">{guide.safety.general}</p>
          {guide.safety.tips && guide.safety.tips.length > 0 && (
            <div className="space-y-2">
              {guide.safety.tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2 text-slate-700">
                  <Shield size={16} className="text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-sm">{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DestinationGuide;

