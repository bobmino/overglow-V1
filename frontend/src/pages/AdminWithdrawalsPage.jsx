import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { DollarSign, CheckCircle, XCircle, CheckCheck, Clock, Filter } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import EmptyState from '../components/EmptyState';
import { logger } from '../utils/logger.js';

const getDateLocale = (language) => {
  const locale = language?.slice(0, 2) || 'fr';
  if (locale === 'ar') return 'ar-MA';
  if (locale === 'es') return 'es-ES';
  if (locale === 'en') return 'en-GB';
  return 'fr-FR';
};

const AdminWithdrawalsPage = () => {
  const { t, i18n } = useTranslation();
  const dateLocale = getDateLocale(i18n.language);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchWithdrawals = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const { data } = await api.get(`/api/withdrawals?${params.toString()}`);
      setWithdrawals(data);
      setLoading(false);
    } catch (error) {
      logger.error('Failed to fetch withdrawals:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [filter, typeFilter]);

  const handleApprove = async (withdrawalId) => {
    try {
      await api.put(`/api/withdrawals/${withdrawalId}/approve`);
      fetchWithdrawals();
    } catch (_error) {
      alert(t('admin.withdrawals.approve_error'));
    }
  };

  const handleReject = async (withdrawalId, reason) => {
    if (!reason || reason.trim() === '') {
      alert(t('admin.withdrawals.rejection_reason_alert'));
      return;
    }
    try {
      await api.put(`/api/withdrawals/${withdrawalId}/reject`, { reason });
      fetchWithdrawals();
    } catch (_error) {
      alert(t('admin.withdrawals.reject_error'));
    }
  };

  const handleProcess = async (withdrawalId) => {
    try {
      await api.put(`/api/withdrawals/${withdrawalId}/process`);
      fetchWithdrawals();
    } catch (_error) {
      alert(t('admin.withdrawals.process_error'));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      Pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      Approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      Processed: { color: 'bg-green-100 text-green-800', icon: CheckCheck },
      Rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    const badge = badges[status] || badges.Pending;
    const Icon = badge.icon;
    const statusLabel = t(`admin.withdrawals.status.${status}`, { defaultValue: status });
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color} flex items-center gap-1`}>
        <Icon size={12} />
        {statusLabel}
      </span>
    );
  };

  const getPaymentMethodLabel = (method) => {
    return t(`admin.withdrawals.payment_methods.${method}`, { defaultValue: method });
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
        <h1 className="text-3xl font-bold text-gray-900">{t('admin.withdrawals.title')}</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">{t('admin.common.filter_status')}</span>
        </div>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('admin.common.all')}
        </button>
        <button
          onClick={() => setFilter('Pending')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('admin.withdrawals.filter_pending')}
        </button>
        <button
          onClick={() => setFilter('Approved')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Approved' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('admin.withdrawals.filter_approved')}
        </button>
        <button
          onClick={() => setFilter('Processed')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Processed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('admin.withdrawals.filter_processed')}
        </button>
        <button
          onClick={() => setFilter('Rejected')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('admin.withdrawals.filter_rejected')}
        </button>

        <div className="ms-4 flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">{t('admin.common.filter_type')}</span>
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              typeFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('admin.common.all')}
          </button>
          <button
            onClick={() => setTypeFilter('operator_payout')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              typeFilter === 'operator_payout' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('admin.withdrawals.type_operator_payout')}
          </button>
          <button
            onClick={() => setTypeFilter('client_refund')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              typeFilter === 'client_refund' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('admin.withdrawals.type_client_refund')}
          </button>
        </div>
      </div>

      {withdrawals.length === 0 ? (
        <EmptyState
          variant="withdrawals"
          title={t('admin.withdrawals.empty_title')}
          subtitle={t('admin.withdrawals.empty_desc')}
        />
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
                      {withdrawal.type === 'operator_payout' ? t('admin.withdrawals.type_operator') : t('admin.withdrawals.type_refund')}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>{t('admin.withdrawals.user_label')}</strong> {withdrawal.user?.name} ({withdrawal.user?.email})</p>
                    {withdrawal.operator && (
                      <p><strong>{t('admin.withdrawals.operator_label')}</strong> {withdrawal.operator?.companyName}</p>
                    )}
                    <p><strong>{t('admin.withdrawals.method_label')}</strong> {getPaymentMethodLabel(withdrawal.paymentMethod)}</p>
                    {withdrawal.paymentDetails?.accountNumber && (
                      <p><strong>{t('admin.withdrawals.account_label')}</strong> {withdrawal.paymentDetails.accountNumber} - {withdrawal.paymentDetails.bankName}</p>
                    )}
                    {withdrawal.paymentDetails?.paypalEmail && (
                      <p><strong>{t('admin.withdrawals.paypal_label')}</strong> {withdrawal.paymentDetails.paypalEmail}</p>
                    )}
                    {withdrawal.reason && (
                      <p><strong>{t('admin.withdrawals.reason_label')}</strong> {withdrawal.reason}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {t('admin.withdrawals.requested_on')} {new Date(withdrawal.createdAt).toLocaleDateString(dateLocale)}
                    </p>
                  </div>
                </div>
              </div>

              {withdrawal.rejectionReason && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
                  <p className="font-semibold">{t('admin.withdrawals.rejection_reason_label')}</p>
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
                      {t('admin.common.approve')}
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt(t('admin.withdrawals.rejection_prompt'));
                        if (reason) handleReject(withdrawal._id, reason);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition flex items-center gap-2"
                    >
                      <XCircle size={16} />
                      {t('admin.common.reject')}
                    </button>
                  </>
                )}
                {withdrawal.status === 'Approved' && (
                  <button
                    onClick={() => handleProcess(withdrawal._id)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition flex items-center gap-2"
                  >
                    <CheckCheck size={16} />
                    {t('admin.withdrawals.mark_processed')}
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
