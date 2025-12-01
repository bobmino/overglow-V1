import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import { Building2, Mail, CheckCircle, XCircle, Clock, AlertCircle, Eye, FileText, User as UserIcon } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

const AdminOperatorsPage = () => {
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
      // Ensure data is an array
      const operatorsArray = Array.isArray(data) ? data : [];
      setOperators(operatorsArray);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch operators:', error);
      setOperators([]); // Set empty array on error
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
      console.error('Failed to update operator status:', error);
      alert(error.response?.data?.message || 'Failed to update operator status');
    }
  };
  
  const handleToggleAutoApprove = async (operatorId, currentValue) => {
    try {
      // Get current operator to preserve status
      const operator = operators.find(op => op._id === operatorId);
      if (!operator) return;
      
      await api.put(`/api/admin/operators/${operatorId}/status`, { 
        status: operator.status, // Keep current status
        autoApproveProducts: !currentValue,
      });
      
      // Update selected operator immediately for better UX
      if (selectedOperator && selectedOperator._id === operatorId) {
        setSelectedOperator({ 
          ...selectedOperator, 
          autoApproveProducts: !currentValue 
        });
      }
      
      // Refresh operators list
      await fetchOperators();
    } catch (error) {
      console.error('Failed to toggle auto-approve:', error);
      alert(error.response?.data?.message || 'Failed to update auto-approve setting');
    }
  };

  const openDetailModal = (operator) => {
    setSelectedOperator(operator);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Active': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Suspended': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Rejected': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'Under Review': { color: 'bg-blue-100 text-blue-800', icon: Clock },
    };
    const badge = badges[status] || { color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color} flex items-center gap-1`}>
        <Icon size={12} />
        {status}
      </span>
    );
  };

  const getOnboardingStatusBadge = (onboarding) => {
    if (!onboarding) return null;
    const status = onboarding.onboardingStatus;
    const badges = {
      'in_progress': { color: 'bg-gray-100 text-gray-800', label: 'En cours' },
      'completed': { color: 'bg-blue-100 text-blue-800', label: 'Complété' },
      'pending_approval': { color: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
      'approved': { color: 'bg-green-100 text-green-800', label: 'Approuvé' },
      'rejected': { color: 'bg-red-100 text-red-800', label: 'Rejeté' },
    };
    const badge = badges[status] || badges['in_progress'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${badge.color}`}>
        {badge.label}
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
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Opérateurs</h1>
        <DashboardNavBar />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setFilter('Active')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Actifs
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
          onClick={() => setFilter('Suspended')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Suspended' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Suspendus
        </button>
        <button
          onClick={() => setFilter('Rejected')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Rejetés
        </button>
        <button
          onClick={() => setFilter('Under Review')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Under Review' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          En révision
        </button>
      </div>

      {operators.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun opérateur</h2>
          <p className="text-gray-600">Aucun opérateur trouvé avec ce filtre</p>
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
                      <span className="font-semibold">Contact:</span> {operator.user?.name}
                    </div>
                    {operator.onboarding && (
                      <div className="flex items-center gap-2">
                        <FileText size={14} />
                        <span>Progression: {operator.onboarding.progress || 0}%</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openDetailModal(operator)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <Eye size={16} />
                    Voir détails
                  </button>
                  {/* Show approve/reject buttons only if onboarding is pending approval */}
                  {operator.onboarding?.onboardingStatus === 'pending_approval' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedOperator(operator);
                          setShowDetailModal(true);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOperator(operator);
                          setShowDetailModal(true);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                      >
                        Rejeter
                      </button>
                    </>
                  )}
                  {/* Show suspend button for Active operators (onboarding already approved) */}
                  {operator.status === 'Active' && operator.onboarding?.onboardingStatus === 'approved' && (
                    <button
                      onClick={() => handleStatusChange(operator._id, 'Suspended')}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
                    >
                      Suspendre
                    </button>
                  )}
                  {/* Show reactivate button for Suspended operators */}
                  {operator.status === 'Suspended' && (
                    <button
                      onClick={() => handleStatusChange(operator._id, 'Active')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                    >
                      Réactiver
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedOperator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedOperator.companyName || selectedOperator.user?.name}
                  </h2>
                  <div className="flex gap-2">
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
              {/* User Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Informations utilisateur</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nom</p>
                    <p className="font-semibold">{selectedOperator.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{selectedOperator.user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Onboarding Info */}
              {selectedOperator.onboarding && (
                <>
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Informations publiques</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Nom public</p>
                        <p className="font-semibold">{selectedOperator.onboarding.publicName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Localisation</p>
                        <p className="font-semibold">
                          {selectedOperator.onboarding.experienceLocation?.city || 'N/A'}
                          {selectedOperator.onboarding.experienceLocation?.address && 
                            ` - ${selectedOperator.onboarding.experienceLocation.address}`
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Description</p>
                        <p className="font-semibold">{selectedOperator.onboarding.experienceDescription || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Type de prestataire</h3>
                    <p className="font-semibold">
                      {selectedOperator.onboarding.providerType === 'company' && 'Personne morale (Société)'}
                      {selectedOperator.onboarding.providerType === 'individual_with_status' && 'Personne physique avec statut'}
                      {selectedOperator.onboarding.providerType === 'individual_without_status' && 'Personne physique sans statut'}
                    </p>
                  </div>

                  {/* Company Info */}
                  {selectedOperator.onboarding.providerType === 'company' && selectedOperator.onboarding.companyInfo && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Informations de la société</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Nom de la société</p>
                          <p className="font-semibold">{selectedOperator.onboarding.companyInfo.companyName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Numéro d'enregistrement</p>
                          <p className="font-semibold">{selectedOperator.onboarding.companyInfo.registrationNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Type d'enregistrement</p>
                          <p className="font-semibold">{selectedOperator.onboarding.companyInfo.registrationType || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Numéro TVA</p>
                          <p className="font-semibold">{selectedOperator.onboarding.companyInfo.taxId || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Forme juridique</p>
                          <p className="font-semibold">{selectedOperator.onboarding.companyInfo.legalForm || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Individual with status */}
                  {selectedOperator.onboarding.providerType === 'individual_with_status' && selectedOperator.onboarding.individualWithStatusInfo && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Informations de statut</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Type de statut</p>
                          <p className="font-semibold">{selectedOperator.onboarding.individualWithStatusInfo.statusType || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Numéro d'enregistrement</p>
                          <p className="font-semibold">{selectedOperator.onboarding.individualWithStatusInfo.registrationNumber || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedOperator.onboarding.rejectionReason && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-bold text-red-900 mb-3">Raison du rejet</h3>
                      <p className="text-red-700">{selectedOperator.onboarding.rejectionReason}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 space-y-4">
              {/* Auto-approve products toggle - only for Active operators */}
              {selectedOperator.status === 'Active' && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Validation automatique des produits
                    </label>
                    <p className="text-xs text-gray-600">
                      Si activé, les produits de cet opérateur seront automatiquement publiés sans validation manuelle
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOperator.autoApproveProducts || false}
                      onChange={() => handleToggleAutoApprove(selectedOperator._id, selectedOperator.autoApproveProducts || false)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              )}

              {/* Onboarding approval/rejection - only if onboarding is pending */}
              {selectedOperator.onboarding?.onboardingStatus === 'pending_approval' && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Notes d'approbation (optionnel)</label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Notes internes..."
                    />
                  </div>
                  <button
                    onClick={() => handleStatusChange(selectedOperator._id, 'Active', '', approvalNotes)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    Approuver
                  </button>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Raison du rejet *</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Expliquez pourquoi cette demande est rejetée..."
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!rejectionReason.trim()) {
                        alert('Veuillez fournir une raison de rejet');
                        return;
                      }
                      handleStatusChange(selectedOperator._id, 'Rejected', rejectionReason);
                    }}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                  >
                    Rejeter
                  </button>
                </div>
              )}

              {/* Account management - for Active operators */}
              {selectedOperator.status === 'Active' && selectedOperator.onboarding?.onboardingStatus !== 'pending_approval' && (
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => handleStatusChange(selectedOperator._id, 'Suspended')}
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
                  >
                    Suspendre le compte
                  </button>
                </div>
              )}

              {/* Reactivate - for Suspended operators */}
              {selectedOperator.status === 'Suspended' && (
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => handleStatusChange(selectedOperator._id, 'Active')}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    Réactiver le compte
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
                  Fermer
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

