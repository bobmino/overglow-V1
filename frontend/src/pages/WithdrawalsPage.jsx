import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { DollarSign, Plus, Clock, CheckCircle, XCircle, CheckCheck } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import EmptyState from '../components/EmptyState';
import DashboardNavBar from '../components/DashboardNavBar';
import { logger } from '../utils/logger.js';

const getDateLocale = (language) => {
  const locale = language?.slice(0, 2) || 'fr';
  if (locale === 'ar') return 'ar-MA';
  if (locale === 'es') return 'es-ES';
  if (locale === 'en') return 'en-GB';
  return 'fr-FR';
};

const WithdrawalsPage = () => {
  const { t, i18n } = useTranslation();
  const dateLocale = getDateLocale(i18n.language);
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
      logger.error('Failed to fetch balance:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const { data } = await api.get('/api/withdrawals/my-withdrawals');
      setWithdrawals(data);
      setLoading(false);
    } catch (error) {
      logger.error('Failed to fetch withdrawals:', error);
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method) => {
    if (method === 'bank_transfer') return t('withdrawals.bank_transfer');
    if (method === 'paypal') return t('withdrawals.paypal');
    return t('withdrawals.stripe');
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
      setError(error.response?.data?.message || t('withdrawals.create_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      Pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      Approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      Processed: { color: 'bg-primary-100 text-primary-800', icon: CheckCheck },
      Rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    const badge = badges[status] || badges.Pending;
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color} flex items-center gap-1`}>
        <Icon size={12} />
        {t(`withdrawals.status.${status}`, { defaultValue: status })}
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
        <h1 className="text-3xl font-bold text-gray-900">{t('withdrawals.title')}</h1>
        <DashboardNavBar />
      </div>

      <div className="bg-gradient-to-r from-green-600 to-primary-600 rounded-xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm mb-2">{t('withdrawals.available_balance')}</p>
            <p className="text-4xl font-bold">€{balance.availableBalance.toFixed(2)}</p>
          </div>
          <DollarSign size={48} className="opacity-20" />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-primary-500/30">
          <div>
            <p className="text-green-100 text-xs mb-1">{t('withdrawals.total_revenue')}</p>
            <p className="text-lg font-semibold">€{balance.totalRevenue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-green-100 text-xs mb-1">{t('withdrawals.total_withdrawn')}</p>
            <p className="text-lg font-semibold">€{balance.totalWithdrawn.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-green-100 text-xs mb-1">{t('withdrawals.pending_count')}</p>
            <p className="text-lg font-semibold">{balance.pendingWithdrawals}</p>
          </div>
        </div>
      </div>

      {balance.availableBalance > 0 && (
        <div className="mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition flex items-center gap-2"
            >
              <Plus size={20} />
              {t('withdrawals.request_withdrawal')}
            </button>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('withdrawals.new_request_title')}</h3>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4" role="alert" aria-live="assertive">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" aria-label={t('withdrawals.form_aria')}>
                <div>
                  <label htmlFor="withdrawal-amount" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('withdrawals.amount_label', { max: balance.availableBalance.toFixed(2) })}
                  </label>
                  <input
                    type="number"
                    id="withdrawal-amount"
                    name="withdrawal-amount"
                    step="0.01"
                    min="0.01"
                    max={balance.availableBalance}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                    aria-required="true"
                    aria-label={t('withdrawals.amount_aria')}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label htmlFor="withdrawal-payment-method" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('withdrawals.payment_method_label')}
                  </label>
                  <select
                    id="withdrawal-payment-method"
                    name="withdrawal-payment-method"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                    aria-required="true"
                    aria-label={t('withdrawals.payment_method_aria')}
                  >
                    <option value="bank_transfer">{t('withdrawals.bank_transfer')}</option>
                    <option value="paypal">{t('withdrawals.paypal')}</option>
                    <option value="stripe">{t('withdrawals.stripe')}</option>
                  </select>
                </div>

                {formData.paymentMethod === 'bank_transfer' && (
                  <>
                    <div>
                      <label htmlFor="withdrawal-account-number" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('withdrawals.account_number_label')}
                      </label>
                      <input
                        type="text"
                        id="withdrawal-account-number"
                        name="withdrawal-account-number"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        required
                        aria-required="true"
                        aria-label={t('withdrawals.account_number_aria')}
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label htmlFor="withdrawal-bank-name" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('withdrawals.bank_name_label')}
                      </label>
                      <input
                        type="text"
                        id="withdrawal-bank-name"
                        name="withdrawal-bank-name"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        required
                        aria-required="true"
                        aria-label={t('withdrawals.bank_name_aria')}
                        autoComplete="organization"
                      />
                    </div>
                  </>
                )}

                {formData.paymentMethod === 'paypal' && (
                  <div>
                    <label htmlFor="withdrawal-paypal-email" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('withdrawals.paypal_email_label')}
                    </label>
                    <input
                      type="email"
                      id="withdrawal-paypal-email"
                      name="withdrawal-paypal-email"
                      value={formData.paypalEmail}
                      onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                      aria-required="true"
                      aria-label={t('withdrawals.paypal_email_aria')}
                      autoComplete="email"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50"
                    aria-label={submitting ? t('withdrawals.submitting_aria') : t('withdrawals.submit_aria')}
                  >
                    {submitting ? t('withdrawals.submitting') : t('withdrawals.submit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setError('');
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                    aria-label={t('withdrawals.cancel_aria')}
                  >
                    {t('admin.common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('withdrawals.history_title')}</h2>

        {withdrawals.length === 0 ? (
          <EmptyState
            variant="withdrawals"
            className="bg-gray-50 rounded-xl"
            title={t('withdrawals.empty_title')}
            subtitle={t('withdrawals.empty_desc')}
          />
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
                      {t('withdrawals.method_label', { method: getPaymentMethodLabel(withdrawal.paymentMethod) })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('withdrawals.requested_on', {
                        date: new Date(withdrawal.createdAt).toLocaleDateString(dateLocale),
                      })}
                    </p>
                  </div>
                </div>

                {withdrawal.rejectionReason && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
                    <p className="font-semibold">{t('withdrawals.rejection_reason')}</p>
                    <p>{withdrawal.rejectionReason}</p>
                  </div>
                )}

                {withdrawal.status === 'Processed' && withdrawal.processedAt && (
                  <div className="bg-primary-50 text-primary-700 p-3 rounded-lg">
                    <p className="font-semibold">
                      {t('withdrawals.processed_on', {
                        date: new Date(withdrawal.processedAt).toLocaleDateString(dateLocale),
                      })}
                    </p>
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
