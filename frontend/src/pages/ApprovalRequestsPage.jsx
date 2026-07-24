import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { AlertCircle, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import ScrollToTopButton from '../components/ScrollToTopButton';
import EmptyState from '../components/EmptyState';
import CockpitPageHero from '../components/CockpitPageHero';
import { logger } from '../utils/logger.js';

const getDateLocale = (language) => {
  const locale = language?.slice(0, 2) || 'fr';
  if (locale === 'ar') return 'ar-MA';
  if (locale === 'es') return 'es-ES';
  if (locale === 'en') return 'en-GB';
  return 'fr-FR';
};

const ApprovalRequestsPage = () => {
  const { t, i18n } = useTranslation();
  const dateLocale = getDateLocale(i18n.language);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchRequests = async () => {
    try {
      const url = filter === 'all'
        ? '/api/approval-requests'
        : `/api/approval-requests?status=${filter}`;
      const { data } = await api.get(url);
      const requestsArray = Array.isArray(data) ? data : [];
      setRequests(requestsArray);
      setLoading(false);
    } catch (error) {
      logger.error('Failed to fetch approval requests:', error);
      setRequests([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleApprove = async (requestId) => {
    try {
      await api.put(`/api/approval-requests/${requestId}/approve`);
      fetchRequests();
    } catch (_error) {
      alert(t('admin.approvals.approve_error'));
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt(t('admin.approvals.rejection_prompt'));
    try {
      await api.put(`/api/approval-requests/${requestId}/reject`, { reason });
      fetchRequests();
    } catch (_error) {
      alert(t('admin.approvals.reject_error'));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-amber-100 text-amber-900', icon: Clock },
      approved: { color: 'bg-primary-100 text-primary-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    const statusLabel = t(`admin.approvals.status.${status}`, { defaultValue: status });
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color} flex items-center gap-1`}>
        <Icon size={12} />
        {statusLabel}
      </span>
    );
  };

  const getEntityLink = (request) => {
    if (!request.entityId) return null;

    switch (request.entityType) {
      case 'Product':
        return `/products/${request.entityId._id || request.entityId}`;
      case 'Review':
        return '/admin/products';
      case 'Operator':
        return '/admin/operators';
      default:
        return null;
    }
  };

  const getEntityName = (request) => {
    if (!request.entityId) return t('admin.common.na');

    if (typeof request.entityId === 'object') {
      if (request.entityType === 'Product') {
        return request.entityId.title || t('admin.approvals.entity_fallback.Product');
      }
      if (request.entityType === 'Operator') {
        return request.entityId.companyName || t('admin.approvals.entity_fallback.Operator');
      }
      if (request.entityType === 'Review') {
        return t('admin.approvals.entity_fallback.Review');
      }
    }
    return t(`admin.approvals.entity_types.${request.entityType}`, { defaultValue: request.entityType });
  };

  const getEntityTypeLabel = (entityType) => {
    return t(`admin.approvals.entity_types.${entityType}`, { defaultValue: entityType });
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
        title={t('admin.approvals.title')}
        subtitle="File d’attente produits, avis et opérateurs à valider."
      />

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-600" />
          <span className="text-sm font-semibold text-slate-700">{t('admin.common.filter_status')}</span>
        </div>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          {t('admin.approvals.filter_all')}
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            filter === 'pending' ? 'bg-secondary-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          {t('admin.approvals.filter_pending')}
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            filter === 'approved' ? 'bg-primary-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          {t('admin.approvals.filter_approved')}
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          {t('admin.approvals.filter_rejected')}
        </button>
      </div>

      {!Array.isArray(requests) || requests.length === 0 ? (
        <EmptyState
          variant="inbox"
          title={t('admin.approvals.empty_title')}
          subtitle={t('admin.approvals.empty_desc')}
        />
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const entityLink = getEntityLink(request);
            const entityName = getEntityName(request);

            return (
              <div key={request._id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle size={24} className="text-primary-600" />
                      <h3 className="text-xl font-bold text-gray-900">
                        {t('admin.approvals.request_for', {
                          entityType: getEntityTypeLabel(request.entityType),
                          entityName,
                        })}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>{t('admin.common.user')}:</strong> {request.user?.name} ({request.user?.email})</p>
                      {request.message && (
                        <p><strong>{t('admin.common.message')}:</strong> {request.message}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {t('admin.approvals.requested_on')} {new Date(request.requestedAt || request.createdAt).toLocaleDateString(dateLocale)}
                      </p>
                      {request.respondedAt && (
                        <p className="text-xs text-gray-500">
                          {t('admin.approvals.responded_on')} {new Date(request.respondedAt).toLocaleDateString(dateLocale)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  {entityLink && (
                    <Link
                      to={entityLink}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                    >
                      {t('admin.approvals.view_entity')}
                    </Link>
                  )}
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(request._id)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        {t('admin.common.approve')}
                      </button>
                      <button
                        onClick={() => handleReject(request._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        {t('admin.common.reject')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default ApprovalRequestsPage;
