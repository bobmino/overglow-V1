import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import { DollarSign, Plus, Clock, CheckCircle, XCircle, CheckCheck } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

const WithdrawalsPage = () => {
  const [balance, setBalance] = useState({
    totalRevenue: 0,
    totalWithdrawn: 0,
    availableBalance: 0,
    pendingWithdrawals: 0,
  });
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    accountNumber: '',
    bankName: '',
    paypalEmail: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBalance();
    fetchWithdrawals();
  }, []);

  const fetchBalance = async () => {
    try {
      const { data } = await api.get('/api/withdrawals/balance');
      setBalance(data);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const { data } = await api.get('/api/withdrawals/my-withdrawals');
      setWithdrawals(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const paymentDetails = {
        accountNumber: formData.accountNumber,
        bankName: formData.bankName,
        paypalEmail: formData.paypalEmail,
      };

      await api.post('/api/withdrawals', {
        amount: parseFloat(formData.amount),
        type: 'operator_payout',
        paymentMethod: formData.paymentMethod,
        paymentDetails,
      });

      setShowForm(false);
      setFormData({
        amount: '',
        paymentMethod: 'bank_transfer',
        accountNumber: '',
        bankName: '',
        paypalEmail: '',
      });
      fetchBalance();
      fetchWithdrawals();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Approved': { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      'Processed': { color: 'bg-green-100 text-green-800', icon: CheckCheck },
      'Rejected': { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    const badge = badges[status] || badges['Pending'];
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color} flex items-center gap-1`}>
        <Icon size={12} />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mes Retraits</h1>
        <DashboardNavBar />
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm mb-2">Solde disponible</p>
            <p className="text-4xl font-bold">€{balance.availableBalance.toFixed(2)}</p>
          </div>
          <DollarSign size={48} className="opacity-20" />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-green-500/30">
          <div>
            <p className="text-green-100 text-xs mb-1">Revenus totaux</p>
            <p className="text-lg font-semibold">€{balance.totalRevenue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-green-100 text-xs mb-1">Total retiré</p>
            <p className="text-lg font-semibold">€{balance.totalWithdrawn.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-green-100 text-xs mb-1">En attente</p>
            <p className="text-lg font-semibold">{balance.pendingWithdrawals}</p>
          </div>
        </div>
      </div>

      {/* Request Withdrawal Button */}
      {balance.availableBalance > 0 && (
        <div className="mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition flex items-center gap-2"
            >
              <Plus size={20} />
              Demander un retrait
            </button>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Nouvelle demande de retrait</h3>
              
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant (max: €{balance.availableBalance.toFixed(2)})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={balance.availableBalance}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de paiement</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="bank_transfer">Virement bancaire</option>
                    <option value="paypal">PayPal</option>
                    <option value="stripe">Stripe</option>
                  </select>
                </div>

                {formData.paymentMethod === 'bank_transfer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de compte</label>
                      <input
                        type="text"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la banque</label>
                      <input
                        type="text"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                  </>
                )}

                {formData.paymentMethod === 'paypal' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email PayPal</label>
                    <input
                      type="email"
                      value={formData.paypalEmail}
                      onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {submitting ? 'Envoi...' : 'Envoyer la demande'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setError('');
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Withdrawals List */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Historique des retraits</h2>
        
        {withdrawals.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun retrait</h3>
            <p className="text-gray-600">Vous n'avez pas encore effectué de demande de retrait</p>
          </div>
        ) : (
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal._id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign size={24} className="text-primary-600" />
                      <h3 className="text-xl font-bold text-gray-900">
                        €{withdrawal.amount.toFixed(2)}
                      </h3>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Méthode: {withdrawal.paymentMethod === 'bank_transfer' ? 'Virement bancaire' : 
                                withdrawal.paymentMethod === 'paypal' ? 'PayPal' : 'Stripe'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Demandé le: {new Date(withdrawal.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                {withdrawal.rejectionReason && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
                    <p className="font-semibold">Raison du rejet:</p>
                    <p>{withdrawal.rejectionReason}</p>
                  </div>
                )}

                {withdrawal.status === 'Processed' && withdrawal.processedAt && (
                  <div className="bg-green-50 text-green-700 p-3 rounded-lg">
                    <p className="font-semibold">Traité le: {new Date(withdrawal.processedAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default WithdrawalsPage;

