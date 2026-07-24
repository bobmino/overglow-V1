import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { Building2, Mail, CheckCircle, XCircle, Clock, AlertCircle, Eye, FileText, User as UserIcon, Edit, Package } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import EmptyState from '../components/EmptyState';
import CockpitPageHero from '../components/CockpitPageHero';
import { logger } from '../utils/logger.js';
import { useToast } from '../context/ToastContext';
import { askConfirm } from '../utils/notify.js';

const AdminOperatorsPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
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
      toast.success(t('admin.operators.status_updated', 'Statut mis à jour'));
      fetchOperators();
      setShowDetailModal(false);
      setSelectedOperator(null);
      setEditMode(false);
      setRejectionReason('');
      setApprovalNotes('');
    } catch (error) {
      logger.error('Failed to update operator status:', error);
      toast.error(error.response?.data?.message || t('admin.operators.status_update_error'));
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

      toast.success(t('admin.operators.auto_approve_updated', 'Auto-approbation mise à jour'));
      await fetchOperators();
    } catch (error) {
      logger.error('Failed to toggle auto-approve:', error);
      toast.error(error.response?.data?.message || t('admin.operators.auto_approve_error'));
    }
  };

  const openDetailModal = (operator, startEdit = false) => {
    setSelectedOperator(operator);
    setEditForm({
      companyName: operator.companyName || '',
      publicName: operator.publicName || '',
      description: operator.description || '',
      phone: operator.phone || '',
      adminNotes: operator.adminNotes || '',
      city: operator.location?.city || '',
      address: operator.location?.address || '',
      autoApproveProducts: !!operator.autoApproveProducts,
    });
    setEditMode(startEdit);
    setShowDetailModal(true);
  };

  const handleSaveOperator = async () => {
    if (!selectedOperator) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/api/admin/operators/${selectedOperator._id}`, {
        companyName: editForm.companyName,
        publicName: editForm.publicName,
        description: editForm.description,
        phone: editForm.phone,
        adminNotes: editForm.adminNotes,
        autoApproveProducts: editForm.autoApproveProducts,
        location: {
          city: editForm.city,
          address: editForm.address,
        },
      });
      setSelectedOperator(data);
      setEditMode(false);
      toast.success(t('admin.operators.save_success', 'Opérateur enregistré'));
      fetchOperators();
    } catch (error) {
      toast.error(error.response?.data?.message || t('admin.operators.save_error', 'Échec de l’enregistrement'));
    } finally {
      setSaving(false);
    }
  };

  const handleComplianceDocStatus = async (docType, status) => {
    if (!selectedOperator?._id) return;
    try {
      const { data } = await api.put(
        `/api/admin/operators/${selectedOperator._id}/compliance-docs/${encodeURIComponent(docType)}`,
        { status }
      );
      setSelectedOperator(data);
      toast.success(t('admin.operators.compliance_updated', 'Document mis à jour'));
      fetchOperators();
    } catch (error) {
      toast.error(
        error.response?.data?.message
        || t('admin.operators.compliance_error', 'Échec mise à jour document')
      );
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      Active: { color: 'bg-primary-100 text-primary-800', icon: CheckCircle },
      Suspended: { color: 'bg-red-100 text-red-800', icon: XCircle },
      Pending: { color: 'bg-amber-100 text-amber-900', icon: Clock },
      Rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      'Under Review': { color: 'bg-secondary-500/15 text-amber-950', icon: Clock },
    };
    const badge = badges[status] || { color: 'bg-slate-100 text-slate-800', icon: AlertCircle };
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
      in_progress: { color: 'bg-slate-100 text-slate-800' },
      completed: { color: 'bg-primary-100 text-primary-800' },
      pending_approval: { color: 'bg-amber-100 text-amber-900' },
      approved: { color: 'bg-primary-100 text-primary-800' },
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
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-primary-100/50 rounded-3xl" />
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-32 bg-slate-200/80 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CockpitPageHero
        title={t('admin.operators.title')}
        subtitle="Partenaires Host — validation, compliance et auto-approbation des offres."
      />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-primary-400'
          }`}
        >
          {t('admin.operators.filter_all')}
        </button>
        <button
          onClick={() => setFilter('Active')}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            filter === 'Active' ? 'bg-primary-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-primary-400'
          }`}
        >
          {t('admin.operators.filter_active')}
        </button>
        <button
          onClick={() => setFilter('Pending')}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            filter === 'Pending' ? 'bg-secondary-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-primary-400'
          }`}
        >
          {t('admin.operators.filter_pending')}
        </button>
        <button
          onClick={() => setFilter('Suspended')}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            filter === 'Suspended' ? 'bg-red-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-primary-400'
          }`}
        >
          {t('admin.operators.filter_suspended')}
        </button>
        <button
          onClick={() => setFilter('Rejected')}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            filter === 'Rejected' ? 'bg-red-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-primary-400'
          }`}
        >
          {t('admin.operators.filter_rejected')}
        </button>
        <button
          onClick={() => setFilter('Under Review')}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            filter === 'Under Review' ? 'bg-primary-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-primary-400'
          }`}
        >
          {t('admin.operators.filter_under_review')}
        </button>
      </div>

      {operators.length === 0 ? (
        <EmptyState
          variant="search"
          title={t('admin.operators.empty_title')}
          subtitle={t('admin.operators.empty_desc')}
        />
      ) : (
        <div className="space-y-4">
          {operators.map((operator) => (
            <div key={operator._id} className="surface-card p-6 hover:shadow-md transition">
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
                    type="button"
                    onClick={() => openDetailModal(operator)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition flex items-center gap-2"
                  >
                    <Eye size={16} />
                    {t('admin.common.view_details')}
                  </button>
                  <button
                    type="button"
                    onClick={() => openDetailModal(operator, true)}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-800 transition flex items-center gap-2"
                  >
                    <Edit size={16} />
                    {t('admin.common.edit')}
                  </button>
                  <Link
                    to={`/admin/products?operator=${operator._id}`}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center gap-2"
                  >
                    <Package size={16} />
                    {t('admin.operators.view_products', 'Produits')}
                  </Link>
                  {operator.onboarding?.onboardingStatus === 'pending_approval' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(operator._id, 'Active')}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
                      >
                        {t('admin.common.approve')}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const reason = window.prompt(t('admin.operators.rejection_reason_placeholder'));
                          if (!reason?.trim()) {
                            toast.error(t('admin.operators.rejection_reason_alert'));
                            return;
                          }
                          await handleStatusChange(operator._id, 'Rejected', reason.trim());
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                      >
                        {t('admin.common.reject')}
                      </button>
                    </>
                  )}
                  {operator.status === 'Active' && (
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await askConfirm(t('admin.operators.suspend_confirm', 'Suspendre cet opérateur ?'));
                        if (ok) handleStatusChange(operator._id, 'Suspended');
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
                    >
                      {t('admin.operators.suspend')}
                    </button>
                  )}
                  {operator.status === 'Suspended' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(operator._id, 'Active')}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
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
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditMode((v) => !v)}
                  className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200"
                >
                  {editMode ? t('admin.common.cancel') : t('admin.common.edit')}
                </button>
                <Link
                  to={`/admin/products?operator=${selectedOperator._id}`}
                  className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-primary-50 text-primary-800 hover:bg-primary-100"
                >
                  {t('admin.operators.view_products', 'Voir ses produits')}
                </Link>
              </div>

              {editMode ? (
                <div className="space-y-3 border rounded-xl p-4 bg-slate-50">
                  <h3 className="text-lg font-bold text-gray-900">{t('admin.operators.edit_title', 'Modifier la fiche')}</h3>
                  {[
                    ['companyName', t('admin.operators.company_name')],
                    ['publicName', t('admin.operators.public_name')],
                    ['phone', t('admin.operators.phone', 'Téléphone')],
                    ['city', t('admin.common.location')],
                    ['address', t('admin.operators.address', 'Adresse')],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                      <input
                        value={editForm[key] || ''}
                        onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      {t('admin.common.description')}
                    </label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      {t('admin.operators.admin_notes', 'Notes internes')}
                    </label>
                    <textarea
                      value={editForm.adminNotes || ''}
                      onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={!!editForm.autoApproveProducts}
                      onChange={(e) =>
                        setEditForm({ ...editForm, autoApproveProducts: e.target.checked })
                      }
                    />
                    {t('admin.operators.auto_approve_label')}
                  </label>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveOperator}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold disabled:opacity-50"
                  >
                    {saving ? t('admin.common.saving', 'Enregistrement…') : t('admin.common.save', 'Enregistrer')}
                  </button>
                </div>
              ) : null}

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
                  <div>
                    <p className="text-sm text-gray-600">{t('admin.operators.phone', 'Téléphone')}</p>
                    <p className="font-semibold">{selectedOperator.phone || t('admin.common.na')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('admin.operators.admin_notes', 'Notes internes')}</p>
                    <p className="font-semibold whitespace-pre-wrap">
                      {selectedOperator.adminNotes || t('admin.common.na')}
                    </p>
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

              {(selectedOperator.activitySectors?.length > 0
                || selectedOperator.complianceDocuments?.length > 0) && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {t('admin.operators.compliance_title', 'Compliance Maroc')}
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">
                    {t('admin.operators.compliance_status', 'Statut')}:{' '}
                    <span className="font-semibold">
                      {selectedOperator.complianceStatus || 'draft'}
                    </span>
                  </p>
                  {selectedOperator.activitySectors?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedOperator.activitySectors.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-800"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    {(selectedOperator.complianceDocuments || []).map((doc) => (
                      <div
                        key={doc.type}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{doc.type}</p>
                          <p className="text-xs text-slate-500">{doc.status}</p>
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary-700 font-medium hover:underline"
                            >
                              {t('admin.operators.view_document', 'Voir le fichier')}
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleComplianceDocStatus(doc.type, 'verified')}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary-600 text-white"
                          >
                            {t('admin.operators.verify', 'Valider')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleComplianceDocStatus(doc.type, 'rejected')}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-100 text-red-800"
                          >
                            {t('admin.operators.reject_doc', 'Refuser')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 space-y-4">
              {selectedOperator.status === 'Active' && (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-border">
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
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
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
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
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
