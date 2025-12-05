import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';
import { Award, CheckCircle, X, Clock, Eye, AlertCircle, FileText } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

const AdminBadgeRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/badge-requests/pending');
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch badge requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir approuver cette demande de badge ?')) return;

    setProcessing(true);
    try {
      await api.put(`/api/badge-requests/${requestId}/approve`, {
        adminNotes: adminNotes.trim() || undefined,
      });
      await fetchRequests();
      setSelectedRequest(null);
      setAdminNotes('');
      alert('Demande approuvée avec succès !');
    } catch (error) {
      console.error('Approve error:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'approbation');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectionReason.trim()) {
      alert('Veuillez fournir une raison de rejet');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir rejeter cette demande de badge ?')) return;

    setProcessing(true);
    try {
      await api.put(`/api/badge-requests/${requestId}/reject`, {
        rejectionReason: rejectionReason.trim(),
        adminNotes: adminNotes.trim() || undefined,
      });
      await fetchRequests();
      setSelectedRequest(null);
      setRejectionReason('');
      setAdminNotes('');
      alert('Demande rejetée');
    } catch (error) {
      console.error('Reject error:', error);
      alert(error.response?.data?.message || 'Erreur lors du rejet');
    } finally {
      setProcessing(false);
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

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Demandes de Badges</h1>
        <DashboardNavBar />
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          to="/admin"
          className="bg-gray-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700 transition"
        >
          Retour au Dashboard
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Award size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucune demande en attente</h2>
          <p className="text-gray-600">Toutes les demandes de badges ont été traitées.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request._id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex gap-6">
                {/* Product Image */}
                <img
                  src={request.product?.images?.[0] || 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=200'}
                  alt={request.product?.title}
                  className="w-32 h-32 rounded-lg object-cover"
                />

                {/* Request Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {request.product?.title}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        {request.product?.city} • {request.product?.category}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold text-white"
                          style={{ backgroundColor: request.badge?.color || '#059669' }}
                        >
                          <span>{request.badge?.icon}</span>
                          <span>{request.badge?.name}</span>
                        </span>
                        <span className="text-sm text-gray-500">
                          Opérateur: {request.operator?.companyName || request.operator?.publicName || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold flex items-center gap-1">
                      <Clock size={14} />
                      En attente
                    </span>
                  </div>

                  {/* Justification */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2 mb-2">
                      <FileText size={18} className="text-gray-600 mt-0.5" />
                      <h4 className="font-semibold text-gray-900">Justification :</h4>
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{request.justification}</p>
                  </div>

                  {/* Evidence */}
                  {(request.evidence?.photos?.length > 0 || request.evidence?.links?.length > 0) && (
                    <div className="mb-4">
                      {request.evidence.photos?.length > 0 && (
                        <div className="mb-2">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Photos :</h4>
                          <div className="flex gap-2 flex-wrap">
                            {request.evidence.photos.map((photo, idx) => (
                              <img
                                key={idx}
                                src={photo}
                                alt={`Preuve ${idx + 1}`}
                                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {request.evidence.links?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Liens :</h4>
                          <div className="space-y-1">
                            {request.evidence.links.map((link, idx) => (
                              <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary-600 hover:underline block"
                              >
                                {link}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Link
                      to={`/products/${request.product?._id}`}
                      className="flex items-center text-gray-700 hover:text-primary-600 transition"
                    >
                      <Eye size={16} className="mr-1" />
                      Voir le produit
                    </Link>
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="flex items-center text-blue-600 hover:text-blue-700 transition"
                    >
                      <FileText size={16} className="mr-1" />
                      Détails
                    </button>
                    <button
                      onClick={() => handleApprove(request._id)}
                      disabled={processing}
                      className="flex items-center text-green-600 hover:text-green-700 transition disabled:opacity-50"
                    >
                      <CheckCircle size={16} className="mr-1" />
                      Approuver
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setRejectionReason('');
                      }}
                      className="flex items-center text-red-600 hover:text-red-700 transition"
                    >
                      <X size={16} className="mr-1" />
                      Rejeter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail/Reject Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Détails de la demande</h2>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectionReason('');
                  setAdminNotes('');
                }}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Fermer"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Produit</h3>
                <p className="text-gray-700">{selectedRequest.product?.title}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Badge demandé</h3>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: selectedRequest.badge?.color || '#059669' }}
                  >
                    <span>{selectedRequest.badge?.icon}</span>
                    <span>{selectedRequest.badge?.name}</span>
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{selectedRequest.badge?.description}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Justification</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedRequest.justification}</p>
              </div>

              {selectedRequest.evidence?.photos?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Photos</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedRequest.evidence.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Preuve ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.evidence?.links?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Liens</h3>
                  <div className="space-y-1">
                    {selectedRequest.evidence.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:underline block"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Notes admin (optionnel)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Notes internes pour cette demande..."
                />
              </div>

              {selectedRequest && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Raison de rejet *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="Expliquez pourquoi cette demande est rejetée..."
                    required
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setRejectionReason('');
                    setAdminNotes('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Fermer
                </button>
                <button
                  onClick={() => handleApprove(selectedRequest._id)}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle size={16} className="inline mr-1" />
                  Approuver
                </button>
                <button
                  onClick={() => handleReject(selectedRequest._id)}
                  disabled={processing || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <X size={16} className="inline mr-1" />
                  Rejeter
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

