import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Award, Gift, Star, Sparkles, ArrowRight } from 'lucide-react';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';
import { logger } from '../utils/logger.js';

const LEVELS = [
  {
    id: 'Bronze',
    color: 'from-amber-700 to-amber-500',
    perks: ['1 pt / 10 MAD', 'Accès catalogue complet'],
  },
  {
    id: 'Silver',
    color: 'from-slate-400 to-slate-300',
    perks: ['×1.2 points', '5 % de réduction', 'Offres exclusives'],
  },
  {
    id: 'Gold',
    color: 'from-yellow-500 to-amber-300',
    perks: ['×1.5 points', '10 % de réduction', 'Annulation gratuite', 'Support prioritaire'],
  },
  {
    id: 'Platinum',
    color: 'from-violet-600 to-fuchsia-400',
    perks: ['×2 points', '15 % de réduction', 'Conciergerie', 'Tous les avantages Gold'],
  },
];

const LoyaltyPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !isAuthenticated) return undefined;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/api/loyalty/status');
        if (!cancelled) setStatus(data);
      } catch (err) {
        logger.error('Loyalty status error:', err);
        if (!cancelled) setError('Impossible de charger votre statut fidélité.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  return (
    <>
      <Helmet>
        <title>{t('loyalty.meta_title', 'Programme de fidélité — Overglow Trip')}</title>
      </Helmet>

      <div className="min-h-screen bg-slate-50">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,#34d399,transparent_45%),radial-gradient(circle_at_80%_0%,#fbbf24,transparent_40%)]" />
          <div className="relative container mx-auto px-4 py-16 md:py-24 max-w-5xl">
            <p className="inline-flex items-center gap-2 text-amber-200 text-sm font-semibold mb-4">
              <Sparkles size={16} /> {t('loyalty.eyebrow', 'Overglow Rewards')}
            </p>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              {t('loyalty.title', 'Programme de fidélité')}
            </h1>
            <p className="text-lg text-slate-200 max-w-2xl mb-8">
              {t(
                'loyalty.subtitle',
                'Gagnez des points à chaque réservation, montez de niveau et débloquez réductions, annulation gratuite et avantages exclusifs.'
              )}
            </p>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-amber-50 transition min-h-11"
              >
                {t('loyalty.cta_join', 'Créer mon compte')} <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </section>

        {isAuthenticated && (
          <section className="container mx-auto px-4 -mt-8 md:-mt-10 relative z-10 max-w-5xl mb-12">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 md:p-8">
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-6 bg-slate-100 rounded w-1/3" />
                  <div className="h-10 bg-slate-100 rounded w-1/2" />
                </div>
              ) : error ? (
                <p className="text-red-600 text-sm">{error}</p>
              ) : status ? (
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Niveau</p>
                    <p className="text-2xl font-heading font-bold text-slate-900 flex items-center gap-2">
                      <Award className="text-amber-500" /> {status.loyaltyLevel}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Points</p>
                    <p className="text-2xl font-heading font-bold text-emerald-700">
                      {status.loyaltyPoints ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Prochain palier</p>
                    <p className="text-sm text-slate-700">
                      {status.pointsToNextLevel?.message || 'Niveau maximum'}
                    </p>
                  </div>
                  {Array.isArray(status.pointsHistory) && status.pointsHistory.length > 0 && (
                    <div className="md:col-span-3 border-t border-slate-100 pt-4">
                      <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Gift size={18} /> Historique récent
                      </h2>
                      <ul className="space-y-2 text-sm">
                        {status.pointsHistory.map((entry, idx) => (
                          <li
                            key={idx}
                            className="flex justify-between gap-3 py-2 border-b border-slate-50 last:border-0"
                          >
                            <span className="text-slate-600">{entry.reason || 'Transaction'}</span>
                            <span
                              className={`font-semibold ${
                                entry.points >= 0 ? 'text-emerald-600' : 'text-red-600'
                              }`}
                            >
                              {entry.points >= 0 ? '+' : ''}
                              {entry.points} pts
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </section>
        )}

        <section className="container mx-auto px-4 py-12 max-w-5xl">
          <h2 className="text-2xl font-heading font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Star className="text-amber-500" /> Niveaux & avantages
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {LEVELS.map((level) => (
              <div key={level.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div
                  className={`inline-flex px-3 py-1 rounded-full text-white text-sm font-bold bg-gradient-to-r ${level.color} mb-3`}
                >
                  {level.id}
                </div>
                <ul className="space-y-1.5 text-sm text-slate-600">
                  {level.perks.map((perk) => (
                    <li key={perk}>• {perk}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-slate-500">
            {t(
              'loyalty.howto',
              'Les points sont crédités après chaque réservation confirmée. 100 points = 1 MAD de réduction à la caisse (selon disponibilité).'
            )}
          </p>
        </section>
      </div>
    </>
  );
};

export default LoyaltyPage;
