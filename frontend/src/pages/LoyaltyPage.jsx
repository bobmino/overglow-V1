import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import { Award, Star, Gift, TrendingUp, History, Coins } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

const LoyaltyPage = () => {
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    fetchLoyaltyStatus();
    fetchHistory();
  }, []);

  const fetchLoyaltyStatus = async () => {
    try {
      const { data } = await api.get('/api/loyalty/status');
      setLoyaltyData(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch loyalty status:', error);
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/api/loyalty/history');
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch loyalty history:', error);
    }
  };

  const handleRedeem = async () => {
    const points = parseInt(pointsToRedeem);
    if (!points || points <= 0 || points > (loyaltyData?.loyaltyPoints || 0)) {
      alert('Montant de points invalide');
      return;
    }

    setRedeeming(true);
    try {
      const { data } = await api.post('/api/loyalty/redeem', { points });
      alert(`Points échangés ! Réduction de ${data.discountAmount.toFixed(2)}€ disponible.`);
      setPointsToRedeem('');
      fetchLoyaltyStatus();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de l\'échange de points');
    } finally {
      setRedeeming(false);
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Bronze': return 'bg-amber-600';
      case 'Silver': return 'bg-gray-400';
      case 'Gold': return 'bg-yellow-500';
      case 'Platinum': return 'bg-purple-600';
      default: return 'bg-gray-400';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'Bronze': return '🥉';
      case 'Silver': return '🥈';
      case 'Gold': return '🥇';
      case 'Platinum': return '💎';
      default: return '⭐';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!loyaltyData) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          Erreur lors du chargement des données de fidélité
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Programme de Fidélité</h1>
          <p className="text-gray-600 mt-1">Gagnez des points et profitez d'avantages exclusifs</p>
        </div>
        <DashboardNavBar />
      </div>

      {/* Current Status */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{getLevelIcon(loyaltyData.loyaltyLevel)}</span>
              <div>
                <h2 className="text-2xl font-bold">Niveau {loyaltyData.loyaltyLevel}</h2>
                <p className="text-primary-100">Multiplicateur de points: {loyaltyData.benefits?.pointsMultiplier || 1}x</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold mb-1">{loyaltyData.loyaltyPoints || 0}</div>
            <div className="text-primary-100">Points disponibles</div>
          </div>
        </div>

        {/* Progress to next level */}
        {loyaltyData.pointsToNextLevel && loyaltyData.pointsToNextLevel.level && (
          <div className="bg-white/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Progression vers {loyaltyData.pointsToNextLevel.level}</span>
              <span className="text-sm">
                {loyaltyData.totalSpent.toFixed(2)}€ / {loyaltyData.totalSpent + loyaltyData.pointsToNextLevel.amount}€
              </span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${getLevelColor(loyaltyData.pointsToNextLevel.level)}`}
                style={{
                  width: `${Math.min(100, ((loyaltyData.totalSpent / (loyaltyData.totalSpent + loyaltyData.pointsToNextLevel.amount)) * 100))}%`
                }}
              />
            </div>
            <p className="text-xs mt-2 text-primary-100">{loyaltyData.pointsToNextLevel.message}</p>
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Gift className="text-primary-600 mb-3" size={32} />
          <h3 className="font-bold text-gray-900 mb-1">Réduction</h3>
          <p className="text-2xl font-bold text-primary-600">{loyaltyData.benefits?.discount || 0}%</p>
          <p className="text-sm text-gray-600 mt-1">Sur toutes vos réservations</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <TrendingUp className="text-green-600 mb-3" size={32} />
          <h3 className="font-bold text-gray-900 mb-1">Multiplicateur</h3>
          <p className="text-2xl font-bold text-green-600">{loyaltyData.benefits?.pointsMultiplier || 1}x</p>
          <p className="text-sm text-gray-600 mt-1">Points gagnés par réservation</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Award className="text-yellow-600 mb-3" size={32} />
          <h3 className="font-bold text-gray-900 mb-1">Total dépensé</h3>
          <p className="text-2xl font-bold text-yellow-600">{loyaltyData.totalSpent?.toFixed(2) || 0}€</p>
          <p className="text-sm text-gray-600 mt-1">{loyaltyData.totalBookings || 0} réservation{loyaltyData.totalBookings > 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Star className="text-purple-600 mb-3" size={32} />
          <h3 className="font-bold text-gray-900 mb-1">Avantages</h3>
          <div className="text-sm text-gray-600 mt-1 space-y-1">
            {loyaltyData.benefits?.freeCancellation && <div>✓ Annulation gratuite</div>}
            {loyaltyData.benefits?.prioritySupport && <div>✓ Support prioritaire</div>}
            {loyaltyData.benefits?.exclusiveDeals && <div>✓ Offres exclusives</div>}
            {loyaltyData.benefits?.conciergeService && <div>✓ Service concierge</div>}
          </div>
        </div>
      </div>

      {/* Redeem Points */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Coins size={24} className="text-yellow-600" />
          Échanger des Points
        </h3>
        <p className="text-gray-600 mb-4">
          100 points = 10€ de réduction. Utilisez vos points lors de votre prochaine réservation.
        </p>
        <div className="flex gap-3">
          <input
            type="number"
            value={pointsToRedeem}
            onChange={(e) => setPointsToRedeem(e.target.value)}
            placeholder="Points à échanger"
            min="100"
            max={loyaltyData.loyaltyPoints}
            step="100"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleRedeem}
            disabled={redeeming || !pointsToRedeem || parseInt(pointsToRedeem) < 100}
            className={`px-6 py-2 rounded-lg font-semibold text-white transition ${
              redeeming || !pointsToRedeem || parseInt(pointsToRedeem) < 100
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {redeeming ? 'Échange...' : 'Échanger'}
          </button>
        </div>
        {pointsToRedeem && parseInt(pointsToRedeem) >= 100 && (
          <p className="text-sm text-gray-600 mt-2">
            Réduction: {(parseInt(pointsToRedeem) / 100 * 10).toFixed(2)}€
          </p>
        )}
      </div>

      {/* Points History */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <History size={24} className="text-gray-600" />
          Historique des Points
        </h3>
        {history.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Aucun historique disponible</p>
        ) : (
          <div className="space-y-3">
            {history.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{entry.reason}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(entry.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className={`text-lg font-bold ${entry.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.points > 0 ? '+' : ''}{entry.points} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default LoyaltyPage;

