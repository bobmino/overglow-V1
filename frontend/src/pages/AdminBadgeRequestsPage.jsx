import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { Award, CheckCircle, X, Clock, Eye, FileText } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { logger } from '../utils/logger.js';
import { useToast } from '../context/ToastContext';
import { askConfirm } from '../utils/notify.js';

const AdminBadgeRequestsPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState('details'); // details | reject

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/badge-requests/admin/all', {
        params: { status: statusFilter },
      });
      setRequests(Array.isArray(data?.requests) ? data.requests : Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error('Failed to fetch badge requests:', error);
      toast.error(t('admin.badge_requests.load_error', 'Impossible de charger les demandes'));
    } finally {
      setLoading(false);
    }
  };

  const openModal = (request, nextMode = 'details') => {
    setSelectedRequest(request);
    setMode(nextMode);
    setAdminNotes('');
    setRejectionReason('');
  };

  const handleApprove = async (requestId) => {
    const ok = await askConfirm(t('admin.badge_requests.approve_confirm'));
    if (!ok) return;

    setProcessing(true);
    try {
      await api.put(`/api/badge-requests/${requestId}/approve`, {
        adminNotes: adminNotes.trim() || undefined,
      });
      toast.success(t('admin.badge_requests.approve_success'));
      setSelectedRequest(null);
      setAdminNotes('');
      await fetchRequests();
    } catch (error) {
      logger.error('Approve error:', error);
      toast.error(error.response?.data?.message || t('admin.badge_requests.approve_error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectionReason.trim()) {
      toast.error(t('admin.badge_requests.rejection_required'));
      return;
    }

    const ok = await askConfirm(t('admin.badge_requests.reject_confirm'));
    if (!ok) return;

    setProcessing(true);
    try {
      await api.put(`/api/badge-requests/${requestId}/reject`, {
        rejectionReason: rejectionReason.trim(),
        adminNotes: adminNotes.trim() || undefined,
      });
      toast.success(t('admin.badge_requests.reject_success'));
      setSelectedRequest(null);
      setRejectionReason('');
      setAdminNotes('');
      await fetchRequests();
    } catch (error) {
      logger.error('Reject error:', error);
      toast.error(error.response?.data?.message || t('admin.badge_requests.reject_error'));
    } finally {
      setProcessing(false);
    }
  };

  const statusBadge = (status) => {
    if (status === 'approved') {
      return 'bg-primary-100 text-primary-800';
    }
    if (status === 'rejected') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('admin.badge_requests.title')}</h1>
        <Link
          to="/admin/badges"
          className="text-sm font-semibold text-primary-700 hover:underline"
        >
          {t('admin.nav.badges')} →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {['pending', 'approved', 'rejected', 'all'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
              statusFilter === s
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t(`admin.badge_requests.filter_${s}`, s)}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Award size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('admin.badge_requests.empty_title')}</h2>
          <p className="text-gray-600">{t('admin.badge_requests.empty_desc')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request._id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex gap-6 flex-col sm:flex-row">
                <img
                  src={request.product?.images?.[0] || '/images/placeholder.webp'}
                  alt={request.product?.title}
                  className="w-full sm:w-32 h-32 rounded-lg object-cover"
                />

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {request.product?.title}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        {request.product?.city} • {request.product?.category}
                      </p>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold text-white"
                          style={{ backgroundColor: request.badge?.color || '#059669' }}
                        >
                          <span>{request.badge?.icon}</span>
                          <span>{request.badge?.name}</span>
                        </span>
                        <span className="text-sm text-gray-500">
                          {t('admin.badge_requests.operator_label', {
                            name:
                              request.operator?.companyName ||
                              request.operator?.publicName ||
                              t('admin.common.na'),
                          })}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shrink-0 ${statusBadge(request.status)}`}
                    >
                      <Clock size={14} />
                      {request.status}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2 mb-2">
                      <FileText size={18} className="text-gray-600 mt-0.5" />
                      <h4 className="font-semibold text-gray-900">
                        {t('admin.badge_requests.justification_label')}
                      </h4>
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{request.justification}</p>
                  </div>

                  {request.reviewedAt && (
                    <p className="text-xs text-gray-500 mb-3">
                      {t('admin.badge_requests.reviewed_at', 'Traité le')}{' '}
                      {new Date(request.reviewedAt).toLocaleString()}
                      {request.reviewedBy?.name ? ` — ${request.reviewedBy.name}` : ''}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                    <Link
                      to={`/products/${request.product?._id}`}
                      className="flex items-center text-gray-700 hover:text-primary-600 transition"
                    >
                      <Eye size={16} className="me-1" />
                      {t('admin.badge_requests.view_product')}
                    </Link>
                    <button
                      type="button"
                      onClick={() => openModal(request, 'details')}
                      className="flex items-center text-blue-600 hover:text-blue-700 transition"
                    >
                      <FileText size={16} className="me-1" />
                      {t('admin.common.details')}
                    </button>
                    {request.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => openModal(request, 'approve')}
                          disabled={processing}
                          className="flex items-center text-primary-600 hover:text-primary-700 transition disabled:opacity-50"
                        >
                          <CheckCircle size={16} className="me-1" />
                          {t('admin.common.approve')}
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal(request, 'reject')}
                          className="flex items-center text-red-600 hover:text-red-700 transition"
                        >
                          <X size={16} className="me-1" />
                          {t('admin.common.reject')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {t('admin.badge_requests.modal_title')}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="font-semibold text-gray-900">{selectedRequest.product?.title}</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedRequest.justification}</p>

              {(mode === 'approve' || mode === 'details') && selectedRequest.status === 'pending' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('admin.badge_requests.admin_notes', 'Notes admin (optionnel)')}
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              {mode === 'reject' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('admin.badge_requests.rejection_label', 'Motif de rejet')} *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <label className="block text-sm font-bold text-gray-700 mb-2 mt-3">
                    {t('admin.badge_requests.admin_notes', 'Notes admin (optionnel)')}
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                {selectedRequest.status === 'pending' && mode !== 'reject' && (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleApprove(selectedRequest._id)}
                    className="btn-primary disabled:opacity-50"
                  >
                    {t('admin.common.approve')}
                  </button>
                )}
                {selectedRequest.status === 'pending' && mode === 'reject' && (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleReject(selectedRequest._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                  >
                    {t('admin.common.reject')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-semibold"
                >
                  {t('admin.common.cancel')}
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

export default AdminBadgeRequestsPage;
