import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';
import { Package, MapPin, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';
import { formatImageUrl } from '../utils/formatImage';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignProductTarget, setAssignProductTarget] = useState(null);
  const [operatorsList, setOperatorsList] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState('');
  const [assignActionClone, setAssignActionClone] = useState(false);
  const [assignCloneStatus, setAssignCloneStatus] = useState('Draft');
  const [assigning, setAssigning] = useState(false);

  const fetchProducts = async () => {
    try {
      const url = filter === 'all' ? '/api/admin/products' : `/api/admin/products?status=${filter}`;
      const { data } = await api.get(url);
      setProducts(Array.isArray(data) ? data : (data?.products || []));
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setLoading(false);
    }
  };

  const fetchOperators = async () => {
    try {
      const { data } = await api.get('/api/admin/operators');
      setOperatorsList(data);
    } catch (error) {
      console.error('Failed to fetch operators:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const handleAssignSubmit = async () => {
    if (!selectedOperator || !assignProductTarget) return;
    setAssigning(true);
    try {
      await api.post(`/api/admin/products/${assignProductTarget._id}/assign`, {
        operatorId: selectedOperator,
        clone: assignActionClone,
        updates: assignActionClone ? { status: assignCloneStatus } : null
      });
      setShowAssignModal(false);
      fetchProducts();
      alert(`Produit ${assignActionClone ? 'cloné et assigné' : 'réassigné'} avec succès!`);
    } catch (error) {
      console.error('Failed to assign product:', error);
      alert('Erreur lors de l\'assignation du produit');
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusChange = async (productId, newStatus) => {
    try {
      await api.put(`/api/admin/products/${productId}/status`, { status: newStatus });
      fetchProducts();
    } catch (error) {
      alert('Failed to update product status');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Published': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Pending Review': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Draft': { color: 'bg-gray-100 text-gray-800', icon: Package },
    };
    const badge = badges[status] || badges['Draft'];
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
            <div key={n} className="h-48 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Validation des Produits</h1>
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
          onClick={() => setFilter('Pending Review')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Pending Review' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          En attente
        </button>
        <button
          onClick={() => setFilter('Published')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Published' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Publiés
        </button>
        <button
          onClick={() => setFilter('Draft')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'Draft' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Brouillons
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun produit</h2>
          <p className="text-gray-600">Aucun produit trouvé avec ce filtre</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
              {product.images && product.images.length > 0 && (
                <img
                  src={formatImageUrl(product.images[0])}
                  alt={product.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{product.title}</h3>
                  {getStatusBadge(product.status)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <MapPin size={14} />
                  {product.city}
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                <div className="text-sm text-gray-500 mb-4">
                  <span className="font-semibold">Opérateur:</span> {product.operator?.companyName || 'N/A'}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/products/${product._id}`}
                    target="_blank"
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    Voir
                  </Link>
                  <button
                    onClick={() => {
                      setAssignProductTarget(product);
                      setShowAssignModal(true);
                      fetchOperators();
                    }}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition"
                  >
                    Assigner
                  </button>
                  {product.status === 'Pending Review' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(product._id, 'Published')}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => handleStatusChange(product._id, 'Draft')}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                      >
                        Rejeter
                      </button>
                    </>
                  )}
                  {product.status === 'Published' && (
                    <button
                      onClick={() => handleStatusChange(product._id, 'Draft')}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                    >
                      Dépublier
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAssignModal && assignProductTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Assigner un Opérateur</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700">Produit: {assignProductTarget.title}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sélectionner un opérateur</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                >
                  <option value="">-- Choisir un opérateur --</option>
                  {operatorsList.map(op => (
                    <option key={op._id} value={op._id}>{op.companyName} ({op.user?.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="cloneProduct" 
                  checked={assignActionClone}
                  onChange={(e) => setAssignActionClone(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="cloneProduct" className="text-sm text-gray-700 font-medium">Cloner le produit (créer une copie)</label>
              </div>

              {assignActionClone && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nouveau statut du clone</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500"
                    value={assignCloneStatus}
                    onChange={(e) => setAssignCloneStatus(e.target.value)}
                  >
                    <option value="Draft">Brouillon</option>
                    <option value="Published">Publié</option>
                    <option value="Pending Review">En attente de révision</option>
                  </select>
                </div>
              )}

              <button
                onClick={handleAssignSubmit}
                disabled={!selectedOperator || assigning}
                className={`w-full py-3 rounded-lg font-bold text-white transition mt-4 ${
                  !selectedOperator || assigning ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {assigning ? 'Traitement en cours...' : (assignActionClone ? 'Cloner et Assigner' : 'Réassigner')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default AdminProductsPage;

