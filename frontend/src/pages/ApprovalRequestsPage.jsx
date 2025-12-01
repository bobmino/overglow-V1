import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import { AlertCircle, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

const ApprovalRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  useEffect(() => {
    fetchRequests();
  }, [filter]);

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
      console.error('Failed to fetch approval requests:', error);
      setRequests([]);
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await api.put(`/api/approval-requests/${requestId}/approve`);
      fetchRequests();
    } catch (error) {
      alert('Failed to approve request');
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Raison du rejet (optionnel):');
    try {
      await api.put(`/api/approval-requests/${requestId}/reject`, { reason });
      fetchRequests();
    } catch (error) {
      alert('Failed to reject request');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'rejected': { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    const badge = badges[status] || badges['pending'];
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color} flex items-center gap-1`}>
        <Icon size={12} />
        {status}
      </span>
    );
  };

  const getEntityLink = (request) => {
    if (!request.entityId) return null;
    
    switch (request.entityType) {
      case 'Product':
        return `/products/${request.entityId._id || request.entityId}`;
      case 'Review':
        return `/admin/products`; // Reviews are managed via products
      case 'Operator':
        return `/admin/operators`;
      default:
        return null;
    }
  };

  const getEntityName = (request) => {
    if (!request.entityId) return 'N/A';
    
    if (typeof request.entityId === 'object') {
      if (request.entityType === 'Product') {
        return request.entityId.title || 'Product';
      } else if (request.entityType === 'Operator') {
        return request.entityId.companyName || 'Operator';
      } else if (request.entityType === 'Review') {
        return 'Review';
      }
    }
    return request.entityType;
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
        <h1 className="text-3xl font-bold text-gray-900">Demandes d'Approbation</h1>
        <DashboardNavBar />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
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
          Toutes
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          En attente
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Approuvées
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Rejetées
        </button>
      </div>

      {!Array.isArray(requests) || requests.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucune demande</h2>
          <p className="text-gray-600">Aucune demande d'approbation trouvée avec ces filtres</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const entityLink = getEntityLink(request);
            const entityName = getEntityName(request);
            
            return (
              <div key={request._id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle size={24} className="text-primary-600" />
                      <h3 className="text-xl font-bold text-gray-900">
                        Demande pour {request.entityType}: {entityName}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Utilisateur:</strong> {request.user?.name} ({request.user?.email})</p>
                      {request.message && (
                        <p><strong>Message:</strong> {request.message}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Demandé le: {new Date(request.requestedAt || request.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      {request.respondedAt && (
                        <p className="text-xs text-gray-500">
                          Répondu le: {new Date(request.respondedAt).toLocaleDateString('fr-FR')}
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
                      Voir l'entité
                    </Link>
                  )}
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(request._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Approuver
                      </button>
                      <button
                        onClick={() => handleReject(request._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        Rejeter
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

