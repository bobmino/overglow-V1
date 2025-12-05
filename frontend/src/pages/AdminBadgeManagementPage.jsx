import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import { Award, Plus, Edit, Trash2, Package, Building2, Save, X } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

const AdminBadgeManagementPage = () => {
  const [badges, setBadges] = useState([]);
  const [products, setProducts] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('badges'); // 'badges', 'assign-products', 'assign-operators'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedOperators, setSelectedOperators] = useState([]);
  const [message, setMessage] = useState('');

  const [newBadge, setNewBadge] = useState({
    name: '',
    type: 'product',
    icon: '🏆',
    color: '#059669',
    description: '',
    isAutomatic: false,
  });

  useEffect(() => {
    fetchBadges();
    if (activeTab === 'assign-products') {
      fetchProducts();
    } else if (activeTab === 'assign-operators') {
      fetchOperators();
    }
  }, [activeTab]);

  const handleInitializeBadges = async () => {
    if (!window.confirm('Voulez-vous initialiser les badges par défaut ? Cela créera les badges Artisan, Éco-responsable et Traditionnel s\'ils n\'existent pas.')) {
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/admin/initialize-badges');
      setMessage('Badges initialisés avec succès!');
      fetchBadges();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors de l\'initialisation');
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async () => {
    try {
      const { data } = await api.get('/api/admin/badges');
      setBadges(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/api/admin/products');
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchOperators = async () => {
    try {
      const { data } = await api.get('/api/admin/operators');
      setOperators(data.operators || []);
    } catch (error) {
      console.error('Failed to fetch operators:', error);
    }
  };

  const handleCreateBadge = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/badges', newBadge);
      setMessage('Badge créé avec succès!');
      setShowCreateModal(false);
      setNewBadge({
        name: '',
        type: 'product',
        icon: '🏆',
        color: '#059669',
        description: '',
        isAutomatic: false,
      });
      fetchBadges();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors de la création du badge');
    }
  };

  const handleAssignToProducts = async () => {
    if (!selectedBadge || selectedProducts.length === 0) {
      setMessage('Veuillez sélectionner un badge et au moins un produit');
      return;
    }

    try {
      const { data } = await api.post('/api/admin/badges/assign-products', {
        badgeId: selectedBadge._id,
        productIds: selectedProducts,
      });
      setMessage(`Badge attribué à ${data.assigned} produit(s) avec succès!`);
      setShowAssignModal(false);
      setSelectedBadge(null);
      setSelectedProducts([]);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors de l\'attribution');
    }
  };

  const handleAssignToOperators = async () => {
    if (!selectedBadge || selectedOperators.length === 0) {
      setMessage('Veuillez sélectionner un badge et au moins un opérateur');
      return;
    }

    try {
      const { data } = await api.post('/api/admin/badges/assign-operators', {
        badgeId: selectedBadge._id,
        operatorIds: selectedOperators,
      });
      setMessage(`Badge attribué à ${data.assigned} opérateur(s) avec succès!`);
      setShowAssignModal(false);
      setSelectedBadge(null);
      setSelectedOperators([]);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors de l\'attribution');
    }
  };

  const handleDeleteBadge = async (badgeId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir désactiver ce badge ?')) {
      return;
    }

    try {
      await api.delete(`/api/admin/badges/${badgeId}`);
      setMessage('Badge désactivé avec succès!');
      fetchBadges();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors de la désactivation');
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Badges</h1>
        <DashboardNavBar />
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('succès') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 font-bold transition ${
            activeTab === 'badges'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Award size={20} className="inline mr-2" />
          Liste des Badges
        </button>
        <button
          onClick={() => setActiveTab('assign-products')}
          className={`px-4 py-2 font-bold transition ${
            activeTab === 'assign-products'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package size={20} className="inline mr-2" />
          Attribuer aux Produits
        </button>
        <button
          onClick={() => setActiveTab('assign-operators')}
          className={`px-4 py-2 font-bold transition ${
            activeTab === 'assign-operators'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Building2 size={20} className="inline mr-2" />
          Attribuer aux Opérateurs
        </button>
      </div>

      {/* Badges List Tab */}
      {activeTab === 'badges' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Tous les Badges</h2>
            <div className="flex gap-2">
              <button
                onClick={handleInitializeBadges}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2"
              >
                <Award size={20} />
                Initialiser les Badges
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition flex items-center gap-2"
              >
                <Plus size={20} />
                Créer un Badge
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div
                key={badge._id}
                className={`p-4 rounded-lg border-2 ${
                  badge.isActive ? 'border-gray-200' : 'border-gray-300 opacity-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{badge.icon}</span>
                    <div>
                      <h3 className="font-bold text-gray-900">{badge.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        badge.type === 'product' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {badge.type === 'product' ? 'Produit' : 'Opérateur'}
                      </span>
                    </div>
                  </div>
                  {!badge.isActive && (
                    <span className="text-xs text-gray-500">Désactivé</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <span
                    className="w-4 h-4 rounded-full inline-block"
                    style={{ backgroundColor: badge.color }}
                  ></span>
                  <span>{badge.isAutomatic ? 'Automatique' : 'Manuel'}</span>
                </div>
                <button
                  onClick={() => handleDeleteBadge(badge._id)}
                  className="text-red-600 hover:text-red-700 text-sm font-bold"
                >
                  <Trash2 size={16} className="inline mr-1" />
                  Désactiver
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign to Products Tab */}
      {activeTab === 'assign-products' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Attribuer un Badge aux Produits</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Sélectionner un Badge (Produit)
            </label>
            <select
              value={selectedBadge?._id || ''}
              onChange={(e) => {
                const badge = badges.find(b => b._id === e.target.value);
                setSelectedBadge(badge);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
            >
              <option value="">Choisir un badge...</option>
              {badges
                .filter(b => b.type === 'product' && b.isActive)
                .map(badge => (
                  <option key={badge._id} value={badge._id}>
                    {badge.icon} {badge.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Sélectionner les Produits
            </label>
            <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-4">
              {products.map((product) => (
                <label
                  key={product._id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProducts([...selectedProducts, product._id]);
                      } else {
                        setSelectedProducts(selectedProducts.filter(id => id !== product._id));
                      }
                    }}
                    className="w-5 h-5 text-primary-600 rounded"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{product.title}</p>
                    <p className="text-sm text-gray-600">
                      {product.category} • {product.location?.city}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {selectedProducts.length} produit(s) sélectionné(s)
            </p>
          </div>

          <button
            onClick={handleAssignToProducts}
            disabled={!selectedBadge || selectedProducts.length === 0}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={20} />
            Attribuer le Badge
          </button>
        </div>
      )}

      {/* Assign to Operators Tab */}
      {activeTab === 'assign-operators' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Attribuer un Badge aux Opérateurs</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Sélectionner un Badge (Opérateur)
            </label>
            <select
              value={selectedBadge?._id || ''}
              onChange={(e) => {
                const badge = badges.find(b => b._id === e.target.value);
                setSelectedBadge(badge);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
            >
              <option value="">Choisir un badge...</option>
              {badges
                .filter(b => b.type === 'operator' && b.isActive)
                .map(badge => (
                  <option key={badge._id} value={badge._id}>
                    {badge.icon} {badge.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Sélectionner les Opérateurs
            </label>
            <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-4">
              {operators.map((operator) => (
                <label
                  key={operator._id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedOperators.includes(operator._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOperators([...selectedOperators, operator._id]);
                      } else {
                        setSelectedOperators(selectedOperators.filter(id => id !== operator._id));
                      }
                    }}
                    className="w-5 h-5 text-primary-600 rounded"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{operator.companyName}</p>
                    <p className="text-sm text-gray-600">
                      {operator.user?.name} • {operator.status}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {selectedOperators.length} opérateur(s) sélectionné(s)
            </p>
          </div>

          <button
            onClick={handleAssignToOperators}
            disabled={!selectedBadge || selectedOperators.length === 0}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={20} />
            Attribuer le Badge
          </button>
        </div>
      )}

      {/* Create Badge Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Créer un Badge</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateBadge} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nom du Badge *
                </label>
                <input
                  type="text"
                  value={newBadge.name}
                  onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  value={newBadge.type}
                  onChange={(e) => setNewBadge({ ...newBadge, type: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
                >
                  <option value="product">Produit</option>
                  <option value="operator">Opérateur</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Icône (Emoji)
                </label>
                <input
                  type="text"
                  value={newBadge.icon}
                  onChange={(e) => setNewBadge({ ...newBadge, icon: e.target.value })}
                  maxLength={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
                  placeholder="🏆"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Couleur (Hex)
                </label>
                <input
                  type="color"
                  value={newBadge.color}
                  onChange={(e) => setNewBadge({ ...newBadge, color: e.target.value })}
                  className="w-full h-12 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={newBadge.description}
                  onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isAutomatic"
                  checked={newBadge.isAutomatic}
                  onChange={(e) => setNewBadge({ ...newBadge, isAutomatic: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded"
                />
                <label htmlFor="isAutomatic" className="text-sm text-gray-700">
                  Badge automatique (attribué automatiquement selon les critères)
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition"
                >
                  Créer
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default AdminBadgeManagementPage;

