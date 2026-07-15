import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { Building2, Mail, CheckCircle, XCircle, Clock, AlertCircle, Eye, FileText, User as UserIcon } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { logger } from '../utils/logger.js';

const AdminOperatorsPage = () => {
  const { t } = useTranslation();
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  const fetchOperators = async () => {
    try {
      const url = filter === 'all' ? '/api/admin/operators' : `/api/admin/operators?status=${filter}`;
      const { data } = await api.get(url);
      setOperators(data);
      setLoading(false);
    } catch (error) {
      logger.error('Failed to fetch operators:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, [filter]);

  const handleStatusChange = async (operatorId, newStatus, reason = '', notes = '', autoApproveProducts = undefined) => {
    try {
      await api.put(`/api/admin/operators/${operatorId}/status`, {
        status: newStatus,
        rejectionReason: reason,
        approvalNotes: notes,
        autoApproveProducts: autoApproveProducts,
      });
      fetchOperators();
      setShowDetailModal(false);
      setSelectedOperator(null);
      setRejectionReason('');
      setApprovalNotes('');
    } catch (error) {
      logger.error('Failed to update operator status:', error);
      alert(error.response?.data?.message || t('admin.operators.status_update_error'));
    }
  };

  const handleToggleAutoApprove = async (operatorId, currentValue) => {
    try {
      const operator = operators.find((op) => op._id === operatorId);
      if (!operator) return;

      await api.put(`/api/admin/operators/${operatorId}/status`, {
        status: operator.status,
        autoApproveProducts: !currentValue,
      });

      if (selectedOperator && selectedOperator._id === operatorId) {
        setSelectedOperator({
          ...selectedOperator,
          autoApproveProducts: !currentValue,
        });
      }

      await fetchOperators();
    } catch (error) {
      logger.error('Failed to toggle auto-approve:', error);
      alert(error.response?.data?.message || t('admin.operators.auto_approve_error'));
    }
  };

  const openDetailModal = (operator) => {
    setSelectedOperator(operator);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      Active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      Suspended: { color: 'bg-red-100 text-red-800', icon: XCircle },
      Pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      Rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      'Under Review': { color: 'bg-blue-100 text-blue-800', icon: Clock },
    };
    const badge = badges[status] || { color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    const Icon = badge.icon;
    const statusLabel = t(`admin.operators.status.${status}`, { defaultValue: status });
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color} flex items-center gap-1`}>
        <Icon size={12} />
        {statusLabel}
      </span>
    );
  };

  const getOnboardingStatusBadge = (onboarding) => {
    if (!onboarding) return null;
    const status = onboarding.onboardingStatus;
    const badges = {
      in_progress: { color: 'bg-gray-100 text-gray-800' },
      completed: { color: 'bg-blue-100 text-blue-800' },
      pending_approval: { color: 'bg-yellow-100 text-yellow-800' },
      approved: { color: 'bg-green-100 text-green-800' },
      rejected: { color: 'bg-red-100 text-red-800' },
    };
    const badge = badges[status] || badges.in_progress;
    const label = t(`admin.operators.onboarding.${status}`, { defaultValue: status });
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${badge.color}`}>
        {label}
      </span>
    );
  };

  const getProviderTypeLabel = (providerType) => {
    if (!providerType) return null;
    return t(`admin.operators.provider_types.${providerType}`, { defaultValue: providerType });
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
        <h1 className="text-3xl font-bold text-gray-900">{t('admin.operators.title')}</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('admin.operators.filter_all')}
        </button>
        <button
          onClick={() => setFilter('Active')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('admin.operators.filter_active')}
        </button>
        <button
          onClick={() => setFilter('Pending')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('admin.operators.filter_pending')}
        </button>
        <button
          onClick={() => setFilter('Suspended')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Suspended' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('admin.operators.filter_suspended')}
        </button>
        <button
          onClick={() => setFilter('Rejected')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('admin.operators.filter_rejected')}
        </button>
        <button
          onClick={() => setFilter('Under Review')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Under Review' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('admin.operators.filter_under_review')}
        </button>
      </div>

      {operators.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('admin.operators.empty_title')}</h2>
          <p className="text-gray-600">{t('admin.operators.empty_desc')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {operators.map((operator) => (
            <div key={operator._id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <Building2 size={24} className="text-primary-600" />
                    <h3 className="text-xl font-bold text-gray-900">{operator.companyName || operator.user?.name}</h3>
                    {getStatusBadge(operator.status)}
                    {getOnboardingStatusBadge(operator.onboarding)}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      {operator.user?.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <UserIcon size={14} />
                      <span className="font-semibold">{t('admin.common.contact')}:</span> {operator.user?.name}
                    </div>
                    {operator.onboarding && (
                      <div className="flex items-center gap-2">
                        <FileText size={14} />
                        <span>{t('admin.operators.progress_label', { percent: operator.onboarding.progress || 0 })}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openDetailModal(operator)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <Eye size={16} />
                    {t('admin.common.view_details')}
                  </button>
                  {operator.onboarding?.onboardingStatus === 'pending_approval' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedOperator(operator);
                          setShowDetailModal(true);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                      >
                        {t('admin.common.approve')}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOperator(operator);
                          setShowDetailModal(true);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                      >
                        {t('admin.common.reject')}
                      </button>
                    </>
                  )}
                  {operator.status === 'Active' && operator.onboarding?.onboardingStatus === 'approved' && (
                    <button
                      onClick={() => handleStatusChange(operator._id, 'Suspended')}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
                    >
                      {t('admin.operators.suspend')}
                    </button>
                  )}
                  {operator.status === 'Suspended' && (
                    <button
                      onClick={() => handleStatusChange(operator._id, 'Active')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                    >
                      {t('admin.operators.reactivate')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetailModal && selectedOperator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedOperator.companyName || selectedOperator.user?.name}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {getStatusBadge(selectedOperator.status)}
                    {getOnboardingStatusBadge(selectedOperator.onboarding)}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedOperator(null);
                    setRejectionReason('');
                    setApprovalNotes('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{t('admin.operators.user_info')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">{t('admin.common.name')}</p>
                    <p className="font-semibold">{selectedOperator.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('admin.common.email')}</p>
                    <p className="font-semibold">{selectedOperator.user?.email}</p>
                  </div>
                </div>
              </div>

              {selectedOperator.onboarding && (
                <>
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{t('admin.operators.public_info')}</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">{t('admin.operators.public_name')}</p>
                        <p className="font-semibold">{selectedOperator.onboarding.publicName || t('admin.common.na')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t('admin.common.location')}</p>
                        <p className="font-semibold">
                          {selectedOperator.onboarding.experienceLocation?.city || t('admin.common.na')}
                          {selectedOperator.onboarding.experienceLocation?.address &&
                            ` - ${selectedOperator.onboarding.experienceLocation.address}`
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t('admin.common.description')}</p>
                        <p className="font-semibold">{selectedOperator.onboarding.experienceDescription || t('admin.common.na')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{t('admin.operators.provider_type')}</h3>
                    <p className="font-semibold">
                      {getProviderTypeLabel(selectedOperator.onboarding.providerType)}
                    </p>
                  </div>

                  {selectedOperator.onboarding.providerType === 'company' && selectedOperator.onboarding.companyInfo && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">{t('admin.operators.company_info')}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">{t('admin.operators.company_name')}</p>
                          <p className="font-semibold">{selectedOperator.onboarding.companyInfo.companyName || t('admin.common.na')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">{t('admin.operators.registration_number')}</p>
                          <p className="font-semibold">{selectedOperator.onboarding.companyInfo.registrationNumber || t('admin.common.na')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">{t('admin.operators.registration_type')}</p>
                          <p className="font-semibold">{selectedOperator.onboarding.companyInfo.registrationType || t('admin.common.na')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">{t('admin.operators.tax_id')}</p>
                          <p className="font-semibold">{selectedOperator.onboarding.companyInfo.taxId || t('admin.common.na')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">{t('admin.operators.legal_form')}</p>
                          <p className="font-semibold">{selectedOperator.onboarding.companyInfo.legalForm || t('admin.common.na')}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedOperator.onboarding.providerType === 'individual_with_status' && selectedOperator.onboarding.individualWithStatusInfo && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">{t('admin.operators.status_info')}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">{t('admin.operators.status_type')}</p>
                          <p className="font-semibold">{selectedOperator.onboarding.individualWithStatusInfo.statusType || t('admin.common.na')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">{t('admin.operators.registration_number')}</p>
                          <p className="font-semibold">{selectedOperator.onboarding.individualWithStatusInfo.registrationNumber || t('admin.common.na')}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedOperator.onboarding.rejectionReason && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-bold text-red-900 mb-3">{t('admin.operators.rejection_reason')}</h3>
                      <p className="text-red-700">{selectedOperator.onboarding.rejectionReason}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 space-y-4">
              {selectedOperator.status === 'Active' && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      {t('admin.operators.auto_approve_label')}
                    </label>
                    <p className="text-xs text-gray-600">
                      {t('admin.operators.auto_approve_desc')}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOperator.autoApproveProducts || false}
                      onChange={() => handleToggleAutoApprove(selectedOperator._id, selectedOperator.autoApproveProducts || false)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              )}

              {selectedOperator.onboarding?.onboardingStatus === 'pending_approval' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('admin.operators.approval_notes')}</label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder={t('admin.operators.approval_notes_placeholder')}
                    />
                  </div>
                  <button
                    onClick={() => handleStatusChange(selectedOperator._id, 'Active', '', approvalNotes)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    {t('admin.common.approve')}
                  </button>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('admin.operators.rejection_reason_required')}</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder={t('admin.operators.rejection_reason_placeholder')}
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!rejectionReason.trim()) {
                        alert(t('admin.operators.rejection_reason_alert'));
                        return;
                      }
                      handleStatusChange(selectedOperator._id, 'Rejected', rejectionReason);
                    }}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                  >
                    {t('admin.common.reject')}
                  </button>
                </div>
              )}

              {selectedOperator.status === 'Active' && selectedOperator.onboarding?.onboardingStatus !== 'pending_approval' && (
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedOperator._id, 'Suspended')}
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
                  >
                    {t('admin.operators.suspend_account')}
                  </button>
                </div>
              )}

              {selectedOperator.status === 'Suspended' && (
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedOperator._id, 'Active')}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    {t('admin.operators.reactivate_account')}
                  </button>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedOperator(null);
                    setRejectionReason('');
                    setApprovalNotes('');
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  {t('admin.common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default AdminOperatorsPage;
