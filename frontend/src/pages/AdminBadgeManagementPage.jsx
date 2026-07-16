import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { Award, Plus, Edit, Trash2, Package, Building2, Save, X, Info } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { logger } from '../utils/logger.js';

const BOOLEAN_CRITERIA_FLAGS = [
  'isVerified',
  'isLocal',
  'isLocal100',
  'isArtisan',
  'isAuthenticLocal',
  'isEcoFriendly',
  'isTraditional',
  'isNew',
  'isBestValue',
  'isLastMinute',
];

// Fonction pour formater les critères d'un badge de manière lisible
const formatCriteria = (criteria, t) => {
  if (!criteria || Object.keys(criteria).length === 0) {
    return t('admin.badges.criteria_none');
  }

  const criteriaList = [];

  // Critères numériques
  if (criteria.minRating) {
    criteriaList.push(t('admin.badges.criteria.min_rating', { value: criteria.minRating }));
  }
  if (criteria.minReviews) {
    criteriaList.push(t('admin.badges.criteria.min_reviews', { value: criteria.minReviews }));
  }
  if (criteria.minBookings) {
    criteriaList.push(t('admin.badges.criteria.min_bookings', { value: criteria.minBookings }));
  }
  if (criteria.minRevenue) {
    criteriaList.push(t('admin.badges.criteria.min_revenue', { value: criteria.minRevenue.toLocaleString() }));
  }
  if (criteria.minViewCount) {
    criteriaList.push(t('admin.badges.criteria.min_views', { value: criteria.minViewCount }));
  }
  if (criteria.minBookingCount) {
    criteriaList.push(t('admin.badges.criteria.min_bookings', { value: criteria.minBookingCount }));
  }
  if (criteria.maxResponseTime) {
    criteriaList.push(t('admin.badges.criteria.max_response', { value: criteria.maxResponseTime }));
  }
  if (criteria.minCompletionRate) {
    criteriaList.push(t('admin.badges.criteria.min_completion', { value: criteria.minCompletionRate }));
  }

  // Critères booléens
  BOOLEAN_CRITERIA_FLAGS.forEach((key) => {
    if (criteria[key] === true) {
      criteriaList.push(t(`admin.badges.flags.${key}_long`));
    }
  });

  return criteriaList.length > 0 ? criteriaList.join(' • ') : t('admin.badges.criteria_none');
};

const AdminBadgeManagementPage = () => {
  const { t } = useTranslation();
  const [badges, setBadges] = useState([]);
  const [products, setProducts] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('badges'); // 'badges', 'assign-products', 'assign-operators'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [selectedBadges, setSelectedBadges] = useState([]); // Multiple badges selection
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedOperators, setSelectedOperators] = useState([]);
  const [message, setMessage] = useState('');
  const [productsWithBadges, setProductsWithBadges] = useState({});
  const [operatorsWithBadges, setOperatorsWithBadges] = useState({});
  const [badgeEntitiesModal, setBadgeEntitiesModal] = useState({ open: false, badge: null, type: 'products', items: [], loading: false });

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
    if (!window.confirm(t('admin.badges.init_confirm'))) {
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/admin/initialize-badges');
      setMessage(t('admin.badges.init_success'));
      fetchBadges();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || t('admin.badges.init_error'));
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
      logger.error('Failed to fetch badges:', error);
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
        } catch (_error) {
          badgesMap[product._id] = [];
        }
      }
      setProductsWithBadges(badgesMap);
    } catch (error) {
      logger.error('Failed to fetch products:', error);
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
        } catch (_error) {
          badgesMap[operator._id] = [];
        }
      }
      setOperatorsWithBadges(badgesMap);
    } catch (error) {
      logger.error('Failed to fetch operators:', error);
      setOperators([]);
      setOperatorsWithBadges({});
    }
  };

  const openBadgeEntities = async (badge, type) => {
    setBadgeEntitiesModal({ open: true, badge, type, items: [], loading: true });
    try {
      const endpoint = type === 'products' ? `/api/admin/badges/${badge._id}/products` : `/api/admin/badges/${badge._id}/operators`;
      const { data } = await api.get(endpoint);
      const items = Array.isArray(data?.products) ? data.products : (Array.isArray(data?.operators) ? data.operators : []);
      setBadgeEntitiesModal({ open: true, badge, type, items, loading: false });
    } catch (error) {
      setBadgeEntitiesModal({ open: true, badge, type, items: [], loading: false });
      setMessage(error.response?.data?.message || t('admin.badges.load_entities_error'));
    }
  };

  const handleCreateBadge = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/badges', newBadge);
      setMessage(t('admin.badges.create_success'));
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
      setMessage(error.response?.data?.message || t('admin.badges.create_error'));
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

  const handleAssignToProducts = async () => {
    if (selectedBadges.length === 0 || selectedProducts.length === 0) {
      setMessage(t('admin.badges.select_badge_product'));
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
      setMessage(t('admin.badges.assign_success', { count: totalAssigned }));
      setSelectedBadges([]);
      setSelectedProducts([]);
      fetchProducts(); // Refresh to show new badges
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || t('admin.badges.assign_error'));
    }
  };

  const handleAssignToOperators = async () => {
    if (selectedBadges.length === 0 || selectedOperators.length === 0) {
      setMessage(t('admin.badges.select_badge_operator'));
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
      setMessage(t('admin.badges.assign_success', { count: totalAssigned }));
      setSelectedBadges([]);
      setSelectedOperators([]);
      fetchOperators(); // Refresh to show new badges
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || t('admin.badges.assign_error'));
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
      setMessage(t('admin.badges.update_success'));
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
      setMessage(error.response?.data?.message || t('admin.badges.update_error'));
    }
  };

  const handleDeleteBadge = async (badgeId) => {
    if (!window.confirm(t('admin.badges.deactivate_confirm'))) {
      return;
    }

    try {
      await api.delete(`/api/admin/badges/${badgeId}`);
      setMessage(t('admin.badges.deactivate_success'));
      fetchBadges();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || t('admin.badges.deactivate_error'));
    }
  };

  const isSuccessMessage = message.toLowerCase().includes(t('admin.common.success_keyword').toLowerCase());

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
        <h1 className="text-3xl font-bold text-gray-900">{t('admin.badges.title')}</h1>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          isSuccessMessage ? 'bg-primary-50 text-primary-700' : 'bg-red-50 text-red-700'
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
          <Award size={20} className="inline me-2" />
          {t('admin.badges.tab_list')}
        </button>
        <button
          onClick={() => setActiveTab('assign-products')}
          className={`px-4 py-2 font-bold transition ${
            activeTab === 'assign-products'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package size={20} className="inline me-2" />
          {t('admin.badges.tab_assign_products')}
        </button>
        <button
          onClick={() => setActiveTab('assign-operators')}
          className={`px-4 py-2 font-bold transition ${
            activeTab === 'assign-operators'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Building2 size={20} className="inline me-2" />
          {t('admin.badges.tab_assign_operators')}
        </button>
      </div>

      {/* Badges List Tab */}
      {activeTab === 'badges' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('admin.badges.all_badges')}</h2>
            <div className="flex gap-2">
              <button
                onClick={handleInitializeBadges}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition flex items-center gap-2"
              >
                <Award size={20} />
                {t('admin.badges.init_badges')}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition flex items-center gap-2"
              >
                <Plus size={20} />
                {t('admin.badges.create_badge')}
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
                        {badge.type === 'product' ? t('admin.common.product') : t('admin.common.operator')}
                      </span>
                    </div>
                  </div>
                  {!badge.isActive && (
                    <span className="text-xs text-gray-500">{t('admin.common.disabled')}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <span
                    className="w-4 h-4 rounded-full inline-block"
                    style={{ backgroundColor: badge.color }}
                  ></span>
                  <span>{badge.isAutomatic ? t('admin.common.automatic') : t('admin.common.manual')}</span>
                </div>
                {badge.isAutomatic && badge.criteria && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Info size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-blue-900 mb-1">{t('admin.badges.criteria_title')}</p>
                        <p className="text-xs text-blue-700 leading-relaxed">
                          {formatCriteria(badge.criteria, t)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEditBadge(badge)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-bold"
                  >
                    <Edit size={16} className="inline me-1" />
                    {t('admin.common.edit')}
                  </button>
                  <button
                    onClick={() => handleDeleteBadge(badge._id)}
                    className="text-red-600 hover:text-red-700 text-sm font-bold"
                  >
                    <Trash2 size={16} className="inline me-1" />
                    {t('admin.common.deactivate')}
                  </button>
                  <button
                    onClick={() => openBadgeEntities(badge, 'products')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-bold"
                  >
                    {t('admin.common.products')}
                  </button>
                  <button
                    onClick={() => openBadgeEntities(badge, 'operators')}
                    className="text-purple-600 hover:text-purple-700 text-sm font-bold"
                  >
                    {t('admin.common.operators')}
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
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('admin.badges.assign_products_title')}</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('admin.badges.select_product_badges')}
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
              {t('admin.badges.badges_selected', { count: selectedBadges.length })}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('admin.badges.select_products')}
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
              {t('admin.badges.products_selected', { count: selectedProducts.length })}
            </p>
          </div>

          <button
            onClick={handleAssignToProducts}
            disabled={selectedBadges.length === 0 || selectedProducts.length === 0}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={20} />
            {t('admin.badges.assign_badges')}
          </button>
        </div>
      )}

      {/* Assign to Operators Tab */}
      {activeTab === 'assign-operators' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('admin.badges.assign_operators_title')}</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('admin.badges.select_operator_badges')}
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
              {t('admin.badges.badges_selected', { count: selectedBadges.length })}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('admin.badges.select_operators')}
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
              {t('admin.badges.operators_selected', { count: selectedOperators.length })}
            </p>
          </div>

          <button
            onClick={handleAssignToOperators}
            disabled={selectedBadges.length === 0 || selectedOperators.length === 0}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={20} />
            {t('admin.badges.assign_badges')}
          </button>
        </div>
      )}

      {/* Edit Badge Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t('admin.badges.edit_badge')}</h2>
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
                  {t('admin.badges.name_label')}
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
                  {t('admin.badges.type_label')}
                </label>
                <select
                  value={newBadge.type}
                  onChange={(e) => setNewBadge({ ...newBadge, type: e.target.value })}
                  required
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 bg-gray-100"
                >
                  <option value="product">{t('admin.common.product')}</option>
                  <option value="operator">{t('admin.common.operator')}</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">{t('admin.badges.type_locked')}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {t('admin.badges.icon_label')}
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
                  {t('admin.badges.color_label')}
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
                  {t('admin.badges.description_label')}
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
                  {t('admin.badges.automatic_badge')}
                </label>
              </div>

              {/* Criteria Form */}
              {newBadge.isAutomatic && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-gray-700">
                      {t('admin.badges.criteria_title')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCriteriaForm(!showCriteriaForm)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-bold"
                    >
                      {showCriteriaForm ? t('admin.common.hide') : t('admin.common.show_edit')}
                    </button>
                  </div>

                  {showCriteriaForm && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                      <p className="text-xs text-gray-600 mb-3">
                        {t('admin.badges.criteria_help')}
                      </p>

                      {/* Numerical Criteria */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            {t('admin.badges.criteria.min_rating_label')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            value={newBadge.criteria?.minRating || ''}
                            onChange={(e) => updateCriteria('minRating', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder={t('admin.badges.criteria.placeholder_rating')}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            {t('admin.badges.criteria.min_reviews_label')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.minReviews || ''}
                            onChange={(e) => updateCriteria('minReviews', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder={t('admin.badges.criteria.placeholder_reviews')}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            {t('admin.badges.criteria.min_bookings_label')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.minBookings || ''}
                            onChange={(e) => updateCriteria('minBookings', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder={t('admin.badges.criteria.placeholder_bookings')}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            {t('admin.badges.criteria.min_revenue_label')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.minRevenue || ''}
                            onChange={(e) => updateCriteria('minRevenue', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder={t('admin.badges.criteria.placeholder_revenue')}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            {t('admin.badges.criteria.min_views_label')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.minViewCount || ''}
                            onChange={(e) => updateCriteria('minViewCount', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder={t('admin.badges.criteria.placeholder_views')}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            {t('admin.badges.criteria.max_response_label')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.maxResponseTime || ''}
                            onChange={(e) => updateCriteria('maxResponseTime', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder={t('admin.badges.criteria.placeholder_response')}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            {t('admin.badges.criteria.min_completion_label')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={newBadge.criteria?.minCompletionRate || ''}
                            onChange={(e) => updateCriteria('minCompletionRate', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder={t('admin.badges.criteria.placeholder_completion')}
                          />
                        </div>
                      </div>

                      {/* Boolean Criteria */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-300">
                        {BOOLEAN_CRITERIA_FLAGS.map((key) => (
                          <label key={key} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newBadge.criteria?.[key] === true}
                              onChange={(e) => updateCriteria(key, e.target.checked ? true : undefined)}
                              className="w-4 h-4 text-primary-600 rounded"
                            />
                            <span className="text-xs text-gray-700">{t(`admin.badges.flags.${key}`)}</span>
                          </label>
                        ))}
                      </div>

                      {/* Display current criteria summary */}
                      {Object.keys(newBadge.criteria || {}).filter(k => newBadge.criteria[k] !== undefined && newBadge.criteria[k] !== '').length > 0 && (
                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                          <p className="text-xs font-bold text-blue-900 mb-1">{t('admin.badges.criteria_preview')}</p>
                          <p className="text-xs text-blue-700">
                            {formatCriteria(newBadge.criteria, t)}
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
                  {t('admin.common.save')}
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
                  {t('admin.common.cancel')}
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
              <h2 className="text-xl font-bold text-gray-900">{t('admin.badges.create_badge')}</h2>
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
                  {t('admin.badges.name_label')}
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
                  {t('admin.badges.type_label')}
                </label>
                <select
                  value={newBadge.type}
                  onChange={(e) => setNewBadge({ ...newBadge, type: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
                >
                  <option value="product">{t('admin.common.product')}</option>
                  <option value="operator">{t('admin.common.operator')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {t('admin.badges.icon_label')}
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
                  {t('admin.badges.color_label')}
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
                  {t('admin.badges.description_label')}
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
                  {t('admin.badges.automatic_badge')}
                </label>
              </div>

              {/* Criteria Form for Create */}
              {newBadge.isAutomatic && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-gray-700">
                      {t('admin.badges.criteria_title')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCriteriaForm(!showCriteriaForm)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-bold"
                    >
                      {showCriteriaForm ? t('admin.common.hide') : t('admin.common.show_define')}
                    </button>
                  </div>

                  {showCriteriaForm && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                      <p className="text-xs text-gray-600 mb-3">
                        {t('admin.badges.criteria_help')}
                      </p>

                      {/* Numerical Criteria */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            {t('admin.badges.criteria.min_rating_label')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            value={newBadge.criteria?.minRating || ''}
                            onChange={(e) => updateCriteria('minRating', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder={t('admin.badges.criteria.placeholder_rating')}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            {t('admin.badges.criteria.min_reviews_label')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.minReviews || ''}
                            onChange={(e) => updateCriteria('minReviews', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder={t('admin.badges.criteria.placeholder_reviews')}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            {t('admin.badges.criteria.min_bookings_label')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.minBookings || ''}
                            onChange={(e) => updateCriteria('minBookings', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder={t('admin.badges.criteria.placeholder_bookings')}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            {t('admin.badges.criteria.min_revenue_label')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.minRevenue || ''}
                            onChange={(e) => updateCriteria('minRevenue', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder={t('admin.badges.criteria.placeholder_revenue')}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            {t('admin.badges.criteria.min_views_label')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.minViewCount || ''}
                            onChange={(e) => updateCriteria('minViewCount', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder={t('admin.badges.criteria.placeholder_views')}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            {t('admin.badges.criteria.max_response_label')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newBadge.criteria?.maxResponseTime || ''}
                            onChange={(e) => updateCriteria('maxResponseTime', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder={t('admin.badges.criteria.placeholder_response')}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            {t('admin.badges.criteria.min_completion_label')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={newBadge.criteria?.minCompletionRate || ''}
                            onChange={(e) => updateCriteria('minCompletionRate', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder={t('admin.badges.criteria.placeholder_completion')}
                          />
                        </div>
                      </div>

                      {/* Boolean Criteria */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-300">
                        {BOOLEAN_CRITERIA_FLAGS.map((key) => (
                          <label key={key} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newBadge.criteria?.[key] === true}
                              onChange={(e) => updateCriteria(key, e.target.checked ? true : undefined)}
                              className="w-4 h-4 text-primary-600 rounded"
                            />
                            <span className="text-xs text-gray-700">{t(`admin.badges.flags.${key}`)}</span>
                          </label>
                        ))}
                      </div>

                      {/* Display current criteria summary */}
                      {Object.keys(newBadge.criteria || {}).filter(k => newBadge.criteria[k] !== undefined && newBadge.criteria[k] !== '').length > 0 && (
                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                          <p className="text-xs font-bold text-blue-900 mb-1">{t('admin.badges.criteria_preview')}</p>
                          <p className="text-xs text-blue-700">
                            {formatCriteria(newBadge.criteria, t)}
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
                  {t('admin.common.create')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition"
                >
                  {t('admin.common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {badgeEntitiesModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">{t('admin.badges.badge_label')}</p>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">{badgeEntitiesModal.badge?.icon}</span>
                  <span>{badgeEntitiesModal.badge?.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${badgeEntitiesModal.badge?.type === 'product' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                    {badgeEntitiesModal.badge?.type === 'product' ? t('admin.common.product') : t('admin.common.operator')}
                  </span>
                </h2>
              </div>
              <button
                onClick={() => setBadgeEntitiesModal({ open: false, badge: null, type: 'products', items: [], loading: false })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-800 mb-2">
                {badgeEntitiesModal.type === 'products' ? t('admin.badges.products_with_badge') : t('admin.badges.operators_with_badge')}
              </h3>
              {badgeEntitiesModal.loading ? (
                <p className="text-sm text-gray-600">{t('admin.common.loading_short')}</p>
              ) : (
                <>
                  {badgeEntitiesModal.items.length === 0 && (
                    <p className="text-sm text-gray-600">{t('admin.badges.no_entities')}</p>
                  )}
                  <div className="space-y-3">
                    {badgeEntitiesModal.type === 'products' && badgeEntitiesModal.items.map((p) => (
                      <div key={p._id} className="p-3 border border-gray-200 rounded-lg flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900">{p.title}</p>
                          <p className="text-sm text-gray-600">{p.category} • {p.city}</p>
                          {Array.isArray(p.badges) && p.badges.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1 text-xs">
                              {p.badges.map((bItem) => {
                                const b = bItem.badgeId || bItem;
                                return (
                                  <span key={b._id} className="px-2 py-1 rounded" style={{ backgroundColor: `${b.color}20`, color: b.color }}>
                                    {b.icon} {b.name}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <a
                          href={`/products/${p._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-600 hover:text-primary-700 text-sm font-bold"
                        >
                          {t('admin.common.open')}
                        </a>
                      </div>
                    ))}

                    {badgeEntitiesModal.type === 'operators' && badgeEntitiesModal.items.map((op) => (
                      <div key={op._id} className="p-3 border border-gray-200 rounded-lg flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900">{op.companyName || t('admin.common.operator')}</p>
                          <p className="text-sm text-gray-600">{op.user?.name} • {op.status}</p>
                          {Array.isArray(op.badges) && op.badges.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1 text-xs">
                              {op.badges.map((bItem) => {
                                const b = bItem.badgeId || bItem;
                                return (
                                  <span key={b._id} className="px-2 py-1 rounded" style={{ backgroundColor: `${b.color}20`, color: b.color }}>
                                    {b.icon} {b.name}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <a
                          href={`/admin/operators`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-bold"
                        >
                          {t('admin.badges.go_operators')}
                        </a>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default AdminBadgeManagementPage;
