import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import { Award, Plus, Edit, Trash2, Package, Building2, Save, X, Info } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

// Fonction pour formater les critères d'un badge de manière lisible
const formatCriteria = (criteria) => {
  if (!criteria || Object.keys(criteria).length === 0) {
    return 'Aucun critère défini';
  }

  const criteriaList = [];

  // Critères numériques
  if (criteria.minRating) {
    criteriaList.push(`Note moyenne ≥ ${criteria.minRating}/5`);
  }
  if (criteria.minReviews) {
    criteriaList.push(`≥ ${criteria.minReviews} avis`);
  }
  if (criteria.minBookings) {
    criteriaList.push(`≥ ${criteria.minBookings} réservations`);
  }
  if (criteria.minRevenue) {
    criteriaList.push(`Revenus ≥ ${criteria.minRevenue.toLocaleString()} MAD`);
  }
  if (criteria.minViewCount) {
    criteriaList.push(`≥ ${criteria.minViewCount} vues`);
  }
  if (criteria.minBookingCount) {
    criteriaList.push(`≥ ${criteria.minBookingCount} réservations`);
  }
  if (criteria.maxResponseTime) {
    criteriaList.push(`Temps de réponse ≤ ${criteria.maxResponseTime}h`);
  }
  if (criteria.minCompletionRate) {
    criteriaList.push(`Taux de complétion ≥ ${criteria.minCompletionRate}%`);
  }

  // Critères booléens
  if (criteria.isVerified === true) {
    criteriaList.push('Opérateur vérifié');
  }
  if (criteria.isLocal === true) {
    criteriaList.push('Local');
  }
  if (criteria.isLocal100 === true) {
    criteriaList.push('100% local');
  }
  if (criteria.isArtisan === true) {
    criteriaList.push('Artisan');
  }
  if (criteria.isAuthenticLocal === true) {
    criteriaList.push('Authentique local');
  }
  if (criteria.isEcoFriendly === true) {
    criteriaList.push('Éco-responsable');
  }
  if (criteria.isTraditional === true) {
    criteriaList.push('Traditionnel');
  }
  if (criteria.isNew === true) {
    criteriaList.push('Nouveau (créé < 30 jours)');
  }
  if (criteria.isBestValue === true) {
    criteriaList.push('Meilleure valeur');
  }
  if (criteria.isLastMinute === true) {
    criteriaList.push('Dernières places (< 24h)');
  }

  return criteriaList.length > 0 ? criteriaList.join(' • ') : 'Aucun critère défini';
};

const AdminBadgeManagementPage = () => {
  const [badges, setBadges] = useState([]);
  const [products, setProducts] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('badges'); // 'badges', 'assign-products', 'assign-operators'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [selectedBadges, setSelectedBadges] = useState([]); // Multiple badges selection
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedOperators, setSelectedOperators] = useState([]);
  const [message, setMessage] = useState('');
  const [productsWithBadges, setProductsWithBadges] = useState({});
  const [operatorsWithBadges, setOperatorsWithBadges] = useState({});

  const [newBadge, setNewBadge] = useState({
    name: '',
    type: 'product',
    icon: '🏆',
    color: '#059669',
    description: '',
    isAutomatic: false,
    criteria: {},
  });

  const [showCriteriaForm, setShowCriteriaForm] = useState(false);

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
      // API renvoie un tableau brut; fallback sur data.products si jamais
      const productsList = Array.isArray(data) ? data : (data.products || []);
      setProducts(productsList);
      
      const badgesMap = {};
      for (const product of productsList) {
        try {
          const { data: badgesData } = await api.get(`/api/badges/product/${product._id}`);
          badgesMap[product._id] = badgesData || [];
        } catch (error) {
          badgesMap[product._id] = [];
        }
      }
      setProductsWithBadges(badgesMap);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
      setProductsWithBadges({});
    }
  };

  const fetchOperators = async () => {
    try {
      const { data } = await api.get('/api/admin/operators');
      const operatorsList = Array.isArray(data) ? data : (data.operators || []);
      setOperators(operatorsList);
      
      const badgesMap = {};
      for (const operator of operatorsList) {
        try {
          const { data: badgesData } = await api.get(`/api/badges/operator/${operator._id}`);
          badgesMap[operator._id] = badgesData || [];
        } catch (error) {
          badgesMap[operator._id] = [];
        }
      }
      setOperatorsWithBadges(badgesMap);
    } catch (error) {
      console.error('Failed to fetch operators:', error);
      setOperators([]);
      setOperatorsWithBadges({});
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
        criteria: {},
      });
      setShowCriteriaForm(false);
      fetchBadges();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors de la création du badge');
    }
  };

  const updateCriteria = (key, value) => {
    setNewBadge(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [key]: value === '' || value === null ? undefined : value
      }
    }));
  };

  const removeCriteria = (key) => {
    setNewBadge(prev => {
      const newCriteria = { ...prev.criteria };
      delete newCriteria[key];
      return {
        ...prev,
        criteria: newCriteria
      };
    });
  };

  const handleAssignToProducts = async () => {
    if (selectedBadges.length === 0 || selectedProducts.length === 0) {
      setMessage('Veuillez sélectionner au moins un badge et un produit');
      return;
    }

    try {
      let totalAssigned = 0;
      for (const badgeId of selectedBadges) {
        const { data } = await api.post('/api/admin/badges/assign-products', {
          badgeId,
          productIds: selectedProducts,
        });
        totalAssigned += data.assigned || 0;
      }
      setMessage(`${totalAssigned} attribution(s) effectuée(s) avec succès!`);
      setSelectedBadges([]);
      setSelectedProducts([]);
      fetchProducts(); // Refresh to show new badges
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors de l\'attribution');
    }
  };

  const handleAssignToOperators = async () => {
    if (selectedBadges.length === 0 || selectedOperators.length === 0) {
      setMessage('Veuillez sélectionner au moins un badge et un opérateur');
      return;
    }

    try {
      let totalAssigned = 0;
      for (const badgeId of selectedBadges) {
        const { data } = await api.post('/api/admin/badges/assign-operators', {
          badgeId,
          operatorIds: selectedOperators,
        });
        totalAssigned += data.assigned || 0;
      }
      setMessage(`${totalAssigned} attribution(s) effectuée(s) avec succès!`);
      setSelectedBadges([]);
      setSelectedOperators([]);
      fetchOperators(); // Refresh to show new badges
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors de l\'attribution');
    }
  };

  const handleEditBadge = (badge) => {
    setSelectedBadge(badge);
    setNewBadge({
      name: badge.name,
      type: badge.type,
      icon: badge.icon,
      color: badge.color,
      description: badge.description,
      isAutomatic: badge.isAutomatic,
    });
    setShowEditModal(true);
  };

  const handleUpdateBadge = async (e) => {
    e.preventDefault();
    if (!selectedBadge) return;

    try {
      const payload = {
        name: newBadge.name,
        icon: newBadge.icon,
        color: newBadge.color,
        description: newBadge.description,
        isAutomatic: newBadge.isAutomatic,
        criteria: newBadge.criteria || {},
      };
      
      await api.put(`/api/admin/badges/${selectedBadge._id}`, payload);
      setMessage('Badge modifié avec succès!');
      setShowEditModal(false);
      setSelectedBadge(null);
      setNewBadge({
        name: '',
        type: 'product',
        icon: '🏆',
        color: '#059669',
        description: '',
        isAutomatic: false,
        criteria: {},
      });
      setShowCriteriaForm(false);
      fetchBadges();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors de la modification');
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
                {badge.isAutomatic && badge.criteria && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Info size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-blue-900 mb-1">Critères d'attribution :</p>
                        <p className="text-xs text-blue-700 leading-relaxed">
                          {formatCriteria(badge.criteria)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditBadge(badge)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-bold"
                  >
                    <Edit size={16} className="inline mr-1" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteBadge(badge._id)}
                    className="text-red-600 hover:text-red-700 text-sm font-bold"
                  >
                    <Trash2 size={16} className="inline mr-1" />
                    Désactiver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign to Products Tab */}
      {activeTab === 'assign-products' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Attribuer des Badges aux Produits</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Sélectionner un ou plusieurs Badges (Produit)
            </label>
            <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-4">
              {badges
                .filter(b => b.type === 'product' && b.isActive)
                .map(badge => (
                  <label
                    key={badge._id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBadges.includes(badge._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBadges([...selectedBadges, badge._id]);
                        } else {
                          setSelectedBadges(selectedBadges.filter(id => id !== badge._id));
                        }
                      }}
                      className="w-5 h-5 text-primary-600 rounded"
                    />
                    <span className="text-xl">{badge.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{badge.name}</p>
                      <p className="text-sm text-gray-600">{badge.description}</p>
                    </div>
                    <span
                      className="w-6 h-6 rounded-full inline-block"
                      style={{ backgroundColor: badge.color }}
                    ></span>
                  </label>
                ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {selectedBadges.length} badge(s) sélectionné(s)
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Sélectionner les Produits
            </label>
            <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-4">
              {products.map((product) => {
                const productBadges = productsWithBadges[product._id] || [];
                return (
                  <label
                    key={product._id}
                    className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200"
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
                      className="w-5 h-5 text-primary-600 rounded mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{product.title}</p>
                      <p className="text-sm text-gray-600 mb-2">
                        {product.category} • {product.location?.city}
                      </p>
                      {productBadges.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {productBadges.map((badgeItem) => {
                            const badge = badges.find(b => b._id === badgeItem.badgeId?._id || badgeItem.badgeId);
                            if (!badge) return null;
                            return (
                              <span
                                key={badgeItem.badgeId?._id || badgeItem.badgeId}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold"
                                style={{ 
                                  backgroundColor: `${badge.color}20`,
                                  color: badge.color,
                                  border: `1px solid ${badge.color}40`
                                }}
                              >
                                <span>{badge.icon}</span>
                                <span>{badge.name}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {selectedProducts.length} produit(s) sélectionné(s)
            </p>
          </div>

          <button
            onClick={handleAssignToProducts}
            disabled={selectedBadges.length === 0 || selectedProducts.length === 0}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={20} />
            Attribuer les Badges
          </button>
        </div>
      )}

      {/* Assign to Operators Tab */}
      {activeTab === 'assign-operators' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Attribuer des Badges aux Opérateurs</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Sélectionner un ou plusieurs Badges (Opérateur)
            </label>
            <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-4">
              {badges
                .filter(b => b.type === 'operator' && b.isActive)
                .map(badge => (
                  <label
                    key={badge._id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBadges.includes(badge._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBadges([...selectedBadges, badge._id]);
                        } else {
                          setSelectedBadges(selectedBadges.filter(id => id !== badge._id));
                        }
                      }}
                      className="w-5 h-5 text-primary-600 rounded"
                    />
                    <span className="text-xl">{badge.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{badge.name}</p>
                      <p className="text-sm text-gray-600">{badge.description}</p>
                    </div>
                    <span
                      className="w-6 h-6 rounded-full inline-block"
                      style={{ backgroundColor: badge.color }}
                    ></span>
                  </label>
                ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {selectedBadges.length} badge(s) sélectionné(s)
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Sélectionner les Opérateurs
            </label>
            <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-4">
              {operators.map((operator) => {
                const operatorBadges = operatorsWithBadges[operator._id] || [];
                return (
                  <label
                    key={operator._id}
                    className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200"
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
                      className="w-5 h-5 text-primary-600 rounded mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{operator.companyName}</p>
                      <p className="text-sm text-gray-600 mb-2">
                        {operator.user?.name} • {operator.status}
                      </p>
                      {operatorBadges.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {operatorBadges.map((badgeItem) => {
                            const badge = badges.find(b => b._id === badgeItem.badgeId?._id || badgeItem.badgeId);
                            if (!badge) return null;
                            return (
                              <span
                                key={badgeItem.badgeId?._id || badgeItem.badgeId}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold"
                                style={{ 
                                  backgroundColor: `${badge.color}20`,
                                  color: badge.color,
                                  border: `1px solid ${badge.color}40`
                                }}
                              >
                                <span>{badge.icon}</span>
                                <span>{badge.name}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {selectedOperators.length} opérateur(s) sélectionné(s)
            </p>
          </div>

          <button
            onClick={handleAssignToOperators}
            disabled={selectedBadges.length === 0 || selectedOperators.length === 0}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={20} />
            Attribuer les Badges
          </button>
        </div>
      )}

      {/* Edit Badge Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Modifier un Badge</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedBadge(null);
                  setNewBadge({
                    name: '',
                    type: 'product',
                    icon: '🏆',
                    color: '#059669',
                    description: '',
                    isAutomatic: false,
                    criteria: {},
                  });
                  setShowCriteriaForm(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateBadge} className="space-y-4">
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
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 bg-gray-100"
                >
                  <option value="product">Produit</option>
                  <option value="operator">Opérateur</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Le type ne peut pas être modifié</p>
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
                  id="isAutomaticEdit"
                  checked={newBadge.isAutomatic}
                  onChange={(e) => setNewBadge({ ...newBadge, isAutomatic: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded"
                />
                <label htmlFor="isAutomaticEdit" className="text-sm text-gray-700">
                  Badge automatique (attribué automatiquement selon les critères)
                </label>
              </div>

              {/* Criteria Form */}
              {newBadge.isAutomatic && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-gray-700">
                      Critères d'attribution
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCriteriaForm(!showCriteriaForm)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-bold"
                    >
                      {showCriteriaForm ? 'Masquer' : 'Afficher/Modifier'}
                    </button>
                  </div>

                  {showCriteriaForm && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                      <p className="text-xs text-gray-600 mb-3">
                        Définissez les critères pour l'attribution automatique de ce badge. Laissez vide pour ignorer un critère.
                      </p>

                      {/* Numerical Criteria */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Note min. (0-5)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            value={newBadge.criteria?.minRating || ''}
                            onChange={(e) => updateCriteria('minRating', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Ex: 4.5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Avis min.
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.minReviews || ''}
                            onChange={(e) => updateCriteria('minReviews', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Ex: 10"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Réservations min.
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.minBookings || ''}
                            onChange={(e) => updateCriteria('minBookings', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Ex: 50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Revenus min. (MAD)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.minRevenue || ''}
                            onChange={(e) => updateCriteria('minRevenue', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Ex: 10000"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Vues min.
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.minViewCount || ''}
                            onChange={(e) => updateCriteria('minViewCount', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Ex: 100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Temps réponse max. (h)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.maxResponseTime || ''}
                            onChange={(e) => updateCriteria('maxResponseTime', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Ex: 2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Taux complétion min. (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={newBadge.criteria?.minCompletionRate || ''}
                            onChange={(e) => updateCriteria('minCompletionRate', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Ex: 95"
                          />
                        </div>
                      </div>

                      {/* Boolean Criteria */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-300">
                        {[
                          { key: 'isVerified', label: 'Vérifié' },
                          { key: 'isLocal', label: 'Local' },
                          { key: 'isLocal100', label: '100% Local' },
                          { key: 'isArtisan', label: 'Artisan' },
                          { key: 'isAuthenticLocal', label: 'Authentique Local' },
                          { key: 'isEcoFriendly', label: 'Éco-responsable' },
                          { key: 'isTraditional', label: 'Traditionnel' },
                          { key: 'isNew', label: 'Nouveau (< 30j)' },
                          { key: 'isBestValue', label: 'Meilleure Valeur' },
                          { key: 'isLastMinute', label: 'Dernières Places' },
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newBadge.criteria?.[key] === true}
                              onChange={(e) => updateCriteria(key, e.target.checked ? true : undefined)}
                              className="w-4 h-4 text-primary-600 rounded"
                            />
                            <span className="text-xs text-gray-700">{label}</span>
                          </label>
                        ))}
                      </div>

                      {/* Display current criteria summary */}
                      {Object.keys(newBadge.criteria || {}).filter(k => newBadge.criteria[k] !== undefined && newBadge.criteria[k] !== '').length > 0 && (
                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                          <p className="text-xs font-bold text-blue-900 mb-1">Aperçu des critères :</p>
                          <p className="text-xs text-blue-700">
                            {formatCriteria(newBadge.criteria)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedBadge(null);
                    setNewBadge({
                      name: '',
                      type: 'product',
                      icon: '🏆',
                      color: '#059669',
                      description: '',
                      isAutomatic: false,
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
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

              {/* Criteria Form for Create */}
              {newBadge.isAutomatic && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-gray-700">
                      Critères d'attribution
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCriteriaForm(!showCriteriaForm)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-bold"
                    >
                      {showCriteriaForm ? 'Masquer' : 'Afficher/Définir'}
                    </button>
                  </div>

                  {showCriteriaForm && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                      <p className="text-xs text-gray-600 mb-3">
                        Définissez les critères pour l'attribution automatique de ce badge. Laissez vide pour ignorer un critère.
                      </p>

                      {/* Numerical Criteria */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Note min. (0-5)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            value={newBadge.criteria?.minRating || ''}
                            onChange={(e) => updateCriteria('minRating', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Ex: 4.5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Avis min.
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.minReviews || ''}
                            onChange={(e) => updateCriteria('minReviews', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Ex: 10"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Réservations min.
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.minBookings || ''}
                            onChange={(e) => updateCriteria('minBookings', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Ex: 50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Revenus min. (MAD)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.minRevenue || ''}
                            onChange={(e) => updateCriteria('minRevenue', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Ex: 10000"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Vues min.
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.minViewCount || ''}
                            onChange={(e) => updateCriteria('minViewCount', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Ex: 100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Temps réponse max. (h)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.maxResponseTime || ''}
                            onChange={(e) => updateCriteria('maxResponseTime', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Ex: 2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Taux complétion min. (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={newBadge.criteria?.minCompletionRate || ''}
                            onChange={(e) => updateCriteria('minCompletionRate', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Ex: 95"
                          />
                        </div>
                      </div>

                      {/* Boolean Criteria */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-300">
                        {[
                          { key: 'isVerified', label: 'Vérifié' },
                          { key: 'isLocal', label: 'Local' },
                          { key: 'isLocal100', label: '100% Local' },
                          { key: 'isArtisan', label: 'Artisan' },
                          { key: 'isAuthenticLocal', label: 'Authentique Local' },
                          { key: 'isEcoFriendly', label: 'Éco-responsable' },
                          { key: 'isTraditional', label: 'Traditionnel' },
                          { key: 'isNew', label: 'Nouveau (< 30j)' },
                          { key: 'isBestValue', label: 'Meilleure Valeur' },
                          { key: 'isLastMinute', label: 'Dernières Places' },
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newBadge.criteria?.[key] === true}
                              onChange={(e) => updateCriteria(key, e.target.checked ? true : undefined)}
                              className="w-4 h-4 text-primary-600 rounded"
                            />
                            <span className="text-xs text-gray-700">{label}</span>
                          </label>
                        ))}
                      </div>

                      {/* Display current criteria summary */}
                      {Object.keys(newBadge.criteria || {}).filter(k => newBadge.criteria[k] !== undefined && newBadge.criteria[k] !== '').length > 0 && (
                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                          <p className="text-xs font-bold text-blue-900 mb-1">Aperçu des critères :</p>
                          <p className="text-xs text-blue-700">
                            {formatCriteria(newBadge.criteria)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

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

