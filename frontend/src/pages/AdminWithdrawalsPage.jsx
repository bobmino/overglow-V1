import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, CheckCircle, XCircle, CheckCheck, Clock, Filter } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

const AdminWithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, processed, rejected
  const [typeFilter, setTypeFilter] = useState('all'); // all, operator_payout, client_refund

  useEffect(() => {
    fetchWithdrawals();
  }, [filter, typeFilter]);

  const fetchWithdrawals = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      
      const { data } = await axios.get(`/api/withdrawals?${params.toString()}`);
      setWithdrawals(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId) => {
    try {
      await axios.put(`/api/withdrawals/${withdrawalId}/approve`);
      fetchWithdrawals();
    } catch (error) {
      alert('Failed to approve withdrawal');
    }
  };

  const handleReject = async (withdrawalId, reason) => {
    if (!reason || reason.trim() === '') {
      alert('Veuillez fournir une raison de rejet');
      return;
    }
    try {
      await axios.put(`/api/withdrawals/${withdrawalId}/reject`, { reason });
      fetchWithdrawals();
    } catch (error) {
      alert('Failed to reject withdrawal');
    }
  };

  const handleProcess = async (withdrawalId) => {
    try {
      await axios.put(`/api/withdrawals/${withdrawalId}/process`);
      fetchWithdrawals();
    } catch (error) {
      alert('Failed to process withdrawal');
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
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Retraits</h1>
        <DashboardNavBar />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">Statut:</span>
        </div>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setFilter('Pending')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          En attente
        </button>
        <button
          onClick={() => setFilter('Approved')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Approved' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Approuvés
        </button>
        <button
          onClick={() => setFilter('Processed')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Processed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Traités
        </button>
        <button
          onClick={() => setFilter('Rejected')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Rejetés
        </button>
        
        <div className="ml-4 flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Type:</span>
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              typeFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setTypeFilter('operator_payout')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              typeFilter === 'operator_payout' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Paiements opérateurs
          </button>
          <button
            onClick={() => setTypeFilter('client_refund')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              typeFilter === 'client_refund' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Remboursements
          </button>
        </div>
      </div>

      {withdrawals.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun retrait</h2>
          <p className="text-gray-600">Aucun retrait trouvé avec ces filtres</p>
        </div>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((withdrawal) => (
            <div key={withdrawal._id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign size={24} className="text-primary-600" />
                    <h3 className="text-xl font-bold text-gray-900">
                      €{withdrawal.amount.toFixed(2)}
                    </h3>
                    {getStatusBadge(withdrawal.status)}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      withdrawal.type === 'operator_payout' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {withdrawal.type === 'operator_payout' ? 'Paiement opérateur' : 'Remboursement'}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Utilisateur:</strong> {withdrawal.user?.name} ({withdrawal.user?.email})</p>
                    {withdrawal.operator && (
                      <p><strong>Opérateur:</strong> {withdrawal.operator?.companyName}</p>
                    )}
                    <p><strong>Méthode:</strong> {
                      withdrawal.paymentMethod === 'bank_transfer' ? 'Virement bancaire' :
                      withdrawal.paymentMethod === 'paypal' ? 'PayPal' : 'Stripe'
                    }</p>
                    {withdrawal.paymentDetails?.accountNumber && (
                      <p><strong>Compte:</strong> {withdrawal.paymentDetails.accountNumber} - {withdrawal.paymentDetails.bankName}</p>
                    )}
                    {withdrawal.paymentDetails?.paypalEmail && (
                      <p><strong>PayPal:</strong> {withdrawal.paymentDetails.paypalEmail}</p>
                    )}
                    {withdrawal.reason && (
                      <p><strong>Raison:</strong> {withdrawal.reason}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Demandé le: {new Date(withdrawal.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              {withdrawal.rejectionReason && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
                  <p className="font-semibold">Raison du rejet:</p>
                  <p>{withdrawal.rejectionReason}</p>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                {withdrawal.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(withdrawal._id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Approuver
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Raison du rejet:');
                        if (reason) handleReject(withdrawal._id, reason);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition flex items-center gap-2"
                    >
                      <XCircle size={16} />
                      Rejeter
                    </button>
                  </>
                )}
                {withdrawal.status === 'Approved' && (
                  <button
                    onClick={() => handleProcess(withdrawal._id)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition flex items-center gap-2"
                  >
                    <CheckCheck size={16} />
                    Marquer comme traité
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default AdminWithdrawalsPage;

