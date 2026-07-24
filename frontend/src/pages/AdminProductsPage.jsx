import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { Package, MapPin, CheckCircle, XCircle, Clock, Eye, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import EmptyState from '../components/EmptyState';
import CockpitPageHero from '../components/CockpitPageHero';
import { formatImageUrl } from '../utils/formatImage';
import { logger } from '../utils/logger.js';
import { useToast } from '../context/ToastContext';

const AdminProductsPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('status') || 'all');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState({ page: 1, limit: 24, total: 0, totalPages: 1 });
  const operatorFilter = searchParams.get('operator') || '';

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignProductTarget, setAssignProductTarget] = useState(null);
  const [operatorsList, setOperatorsList] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState('');
  const [assignActionClone, setAssignActionClone] = useState(false);
  const [assignCloneStatus, setAssignCloneStatus] = useState('Draft');
  const [assigning, setAssigning] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 24 };
      if (filter !== 'all') params.status = filter;
      if (search.trim()) params.search = search.trim();
      if (operatorFilter) params.operator = operatorFilter;
      const { data } = await api.get('/api/admin/products', { params });
      setProducts(Array.isArray(data) ? data : data?.products || []);
      setPagination(
        data?.pagination || {
          page,
          limit: 24,
          total: Array.isArray(data) ? data.length : data?.products?.length || 0,
          totalPages: 1,
        }
      );
    } catch (error) {
      logger.error('Failed to fetch products:', error);
      toast.error(t('admin.products.load_error', 'Impossible de charger les produits'));
    } finally {
      setLoading(false);
    }
  };

  const fetchOperators = async () => {
    try {
      const { data } = await api.get('/api/admin/operators');
      setOperatorsList(Array.isArray(data) ? data : data?.operators || []);
    } catch (error) {
      logger.error('Failed to fetch operators:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    const next = new URLSearchParams();
    if (filter !== 'all') next.set('status', filter);
    if (search.trim()) next.set('q', search.trim());
    if (operatorFilter) next.set('operator', operatorFilter);
    if (page > 1) next.set('page', String(page));
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page, operatorFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleAssignSubmit = async () => {
    if (!selectedOperator || !assignProductTarget) return;
    setAssigning(true);
    try {
      await api.post(`/api/admin/products/${assignProductTarget._id}/assign`, {
        operatorId: selectedOperator,
        clone: assignActionClone,
        updates: assignActionClone ? { status: assignCloneStatus } : null,
      });
      setShowAssignModal(false);
      toast.success(
        assignActionClone
          ? t('admin.products.assign_success_clone')
          : t('admin.products.assign_success_reassign')
      );
      fetchProducts();
    } catch (error) {
      logger.error('Failed to assign product:', error);
      toast.error(t('admin.products.assign_error'));
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusChange = async (productId, newStatus) => {
    try {
      await api.put(`/api/admin/products/${productId}/status`, { status: newStatus });
      toast.success(t('admin.products.status_updated', 'Statut mis à jour'));
      fetchProducts();
    } catch (_error) {
      toast.error(t('admin.products.status_update_error'));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      Published: { color: 'bg-primary-100 text-primary-800', icon: CheckCircle },
      'Pending Review': { color: 'bg-amber-100 text-amber-900', icon: Clock },
      Draft: { color: 'bg-slate-100 text-slate-800', icon: Package },
    };
    const badge = badges[status] || badges.Draft;
    const Icon = badge.icon;
    const statusLabel = t(`admin.products.status.${status}`, { defaultValue: status });
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color} flex items-center gap-1`}>
        <Icon size={12} />
        {statusLabel}
      </span>
    );
  };

  if (loading && products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <CockpitPageHero
        title={t('admin.products.title')}
        subtitle={`${pagination.total} ${t('admin.products.count_label', 'produits')} — validation, publication et assignation.`}
      />

      <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.products.search_placeholder', 'Titre, ville, catégorie…')}
          className="flex-1 min-w-[200px] px-4 py-2 border border-slate-200 rounded-xl bg-white"
        />
        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700">
          {t('admin.common.search', 'Rechercher')}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: t('admin.products.filter_all') },
          { value: 'Pending Review', label: t('admin.products.filter_pending') },
          { value: 'Published', label: t('admin.products.filter_published') },
          { value: 'Draft', label: t('admin.products.filter_draft') },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              setFilter(opt.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold border ${
              filter === opt.value
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-slate-700 border-slate-200 hover:border-primary-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
        {operatorFilter && (
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete('operator');
              setSearchParams(next);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-amber-50 text-amber-800 border border-amber-200"
          >
            {t('admin.products.clear_operator_filter', 'Retirer filtre opérateur')} ×
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <EmptyState
          variant="products"
          title={t('admin.products.empty_title')}
          subtitle={t('admin.products.empty_desc')}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="surface-card overflow-hidden hover:shadow-md transition"
              >
                {product.images && product.images.length > 0 && (
                  <img
                    src={formatImageUrl(product.images[0])}
                    alt={product.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{product.title}</h3>
                    {getStatusBadge(product.status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <MapPin size={14} />
                    {product.city}
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                  <div className="text-sm text-gray-500 mb-4">
                    <span className="font-semibold">{t('admin.products.operator_label')}</span>{' '}
                    {product.operator?.companyName || t('admin.common.na')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/admin/products/${product._id}/edit`}
                      className="flex-1 min-w-[100px] px-3 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition flex items-center justify-center gap-2"
                    >
                      <Edit size={16} />
                      {t('admin.common.edit')}
                    </Link>
                    <Link
                      to={`/products/${product._id}`}
                      target="_blank"
                      className="flex-1 min-w-[100px] px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      {t('admin.common.view')}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setAssignProductTarget(product);
                        setShowAssignModal(true);
                        fetchOperators();
                      }}
                      className="flex-1 min-w-[100px] px-3 py-2 bg-secondary-500/15 text-amber-900 rounded-lg font-semibold hover:bg-secondary-500/25 transition"
                    >
                      {t('admin.products.assign')}
                    </button>
                    {product.status === 'Pending Review' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(product._id, 'Published')}
                          className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
                        >
                          {t('admin.common.approve')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(product._id, 'Draft')}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                        >
                          {t('admin.common.reject')}
                        </button>
                      </>
                    )}
                    {product.status === 'Published' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(product._id, 'Draft')}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                      >
                        {t('admin.products.unpublish')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-2 border rounded-lg disabled:opacity-40"
              >
                <ChevronLeft size={18} /> {t('admin.common.prev', 'Préc.')}
              </button>
              <span className="text-sm text-gray-600">
                {page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-2 border rounded-lg disabled:opacity-40"
              >
                {t('admin.common.next', 'Suiv.')} <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {showAssignModal && assignProductTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">{t('admin.products.assign_modal_title')}</h3>
              <button type="button" onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700">
                {t('admin.products.product_label')} {assignProductTarget.title}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('admin.products.select_operator')}
                </label>
                <select
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                >
                  <option value="">{t('admin.products.choose_operator_placeholder')}</option>
                  {operatorsList.map((op) => (
                    <option key={op._id} value={op._id}>
                      {op.companyName} ({op.user?.email})
                    </option>
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
                <label htmlFor="cloneProduct" className="text-sm text-gray-700 font-medium">
                  {t('admin.products.clone_checkbox')}
                </label>
              </div>

              {assignActionClone && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('admin.products.clone_status_label')}
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500"
                    value={assignCloneStatus}
                    onChange={(e) => setAssignCloneStatus(e.target.value)}
                  >
                    <option value="Draft">{t('admin.products.status.Draft')}</option>
                    <option value="Published">{t('admin.products.status.Published')}</option>
                    <option value="Pending Review">{t('admin.products.status.Pending Review')}</option>
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={handleAssignSubmit}
                disabled={!selectedOperator || assigning}
                className={`w-full py-3 rounded-lg font-bold text-white transition mt-4 ${
                  !selectedOperator || assigning
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {assigning
                  ? t('admin.products.processing')
                  : assignActionClone
                    ? t('admin.products.clone_and_assign')
                    : t('admin.products.reassign')}
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
