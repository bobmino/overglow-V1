import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { Plus, Edit, Trash2, Eye, Rocket, PauseCircle, AlertCircle, Award } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import EmptyState from '../components/EmptyState';
import BadgeRequestModal from '../components/BadgeRequestModal';
import CockpitPageHero from '../components/CockpitPageHero';
import { formatImageUrlWithFallback } from '../utils/formatImage';
import { logger } from '../utils/logger.js';
import { useToast } from '../context/ToastContext';
import { askConfirm } from '../utils/notify';
import { usePlatformSettings } from '../context/PlatformSettingsContext';

const OperatorProductsPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { settings } = usePlatformSettings();
  const commission = Number(settings.platformCommissionPercent ?? 15);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingApproval, setRequestingApproval] = useState({});
  const [badgeRequestModal, setBadgeRequestModal] = useState({ isOpen: false, productId: null, productTitle: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/api/products/my-products');
      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      logger.error('Failed to fetch products:', error);
      toast.error(t('operator.products.load_error', 'Impossible de charger les produits'));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (typeFilter !== 'all' && (p.productType || 'tour') !== typeFilter) return false;
      return true;
    });
  }, [products, statusFilter, typeFilter]);

  const getProductStatusLabel = (status) => {
    if (status === 'Published') return t('operator.products.status_published');
    if (status === 'Pending Review') return t('operator.products.status_pending_review');
    return t('operator.products.status_draft');
  };

  const handleRequestApproval = async (productId) => {
    setRequestingApproval((prev) => ({ ...prev, [productId]: true }));
    try {
      await api.post('/api/approval-requests', {
        entityType: 'Product',
        entityId: productId,
        message: t('operator.products.request_approval_message', 'Demande de validation produit'),
      });
      toast.success(t('operator.products.request_approval_success', 'Demande envoyée'));
      await fetchProducts();
    } catch (error) {
      logger.error('Failed to request product approval:', error);
      toast.error(
        error.response?.data?.message ||
          t('operator.products.request_approval_error', 'Impossible d’envoyer la demande')
      );
    } finally {
      setRequestingApproval((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleDelete = async (id) => {
    const ok = await askConfirm(t('operator.products.confirm_delete'));
    if (!ok) return;

    try {
      await api.delete(`/api/products/${id}`);
      toast.success(t('operator.products.delete_success', 'Produit supprimé'));
      fetchProducts();
    } catch (_error) {
      toast.error(t('operator.products.delete_error'));
    }
  };

  const handleTogglePublish = async (product) => {
    const nextStatus = product.status === 'Published' ? 'Draft' : 'Published';
    try {
      const payload = {
        title: product.title,
        description: product.description,
        category: product.category,
        productType: product.productType,
        city: product.city,
        address: product.address,
        duration: product.duration,
        price: product.price,
        images: product.images,
        highlights: product.highlights,
        included: product.included,
        excluded: product.excluded,
        requirements: product.requirements,
        status: nextStatus,
      };
      await api.put(`/api/products/${product._id}`, payload);
      toast.success(
        nextStatus === 'Published'
          ? t('operator.products.published_ok', 'Produit publié')
          : t('operator.products.draft_ok', 'Remis en brouillon')
      );
      fetchProducts();
    } catch (_error) {
      alert(t('operator.products.status_update_error'));
    }
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
        eyebrow="Overglow Host"
        variant="operator"
        title={t('operator.products.title')}
        subtitle={t(
          'operator.products.subtitle',
          'Créer, modifier, publier ou supprimer vos offres.'
        )}
        actions={(
          <Link
            to="/operator/products/new"
            className="inline-flex items-center justify-center gap-2 bg-white text-primary-900 px-5 py-2.5 rounded-xl font-bold hover:bg-primary-50 transition"
          >
            <Plus size={18} />
            {t('operator.common.create_product')}
          </Link>
        )}
      />

      <div className="rounded-2xl border border-primary-200 bg-primary-50/60 px-4 py-3 text-sm text-primary-900">
        Commission plateforme actuelle : <strong>{commission} %</strong> — appliquée sur vos ventes confirmées (réglage Admin → Paramètres → Finances).
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
        >
          <option value="all">{t('operator.products.filter_all_status', 'Tous les statuts')}</option>
          <option value="Draft">Draft</option>
          <option value="Pending Review">Pending Review</option>
          <option value="Published">Published</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
        >
          <option value="all">{t('operator.products.filter_all_types', 'Tous les types')}</option>
          <option value="tour">Tour</option>
          <option value="luxury_stay">Séjour</option>
          <option value="service">Service</option>
        </select>
      </div>

      {products.length === 0 ? (
        <EmptyState
          variant="products"
          className="bg-slate-50 rounded-xl"
          title={t('operator.products.empty_title')}
          subtitle={t('operator.products.empty_desc')}
          ctaLabel={t('operator.common.create_product')}
          ctaTo="/operator/products/new"
          ctaVariant="primary"
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-600 border border-dashed rounded-xl">
          {t('operator.products.empty_filter', 'Aucun produit pour ces filtres.')}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((product) => (
            <div key={product._id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition">
              <div className="flex gap-6">
                <img
                  src={formatImageUrlWithFallback(product.images?.[0])}
                  alt={product.title}
                  className="w-32 h-32 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{product.title}</h3>
                      <p className="text-gray-600">{product.city} • {product.category}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      product.status === 'Published' 
                        ? 'bg-primary-100 text-primary-800' 
                        : product.status === 'Pending Review'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {getProductStatusLabel(product.status)}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-4 line-clamp-2">{product.description}</p>
                  <div className="flex flex-wrap gap-4">
                    <Link
                      to={`/products/${product._id}`}
                      className="flex items-center text-gray-700 hover:text-primary-700 transition"
                    >
                      <Eye size={16} className="me-1" />
                      {t('operator.common.view')}
                    </Link>
                    <Link
                      to={`/operator/products/${product._id}/edit`}
                      className="flex items-center text-primary-700 hover:text-primary-800 transition"
                    >
                      <Edit size={16} className="me-1" />
                      {t('operator.common.edit')}
                    </Link>
                    {product.status === 'Pending Review' && (
                      <button
                        onClick={() => handleRequestApproval(product._id)}
                        disabled={requestingApproval[product._id]}
                        className="flex items-center text-secondary-600 hover:text-amber-700 transition disabled:opacity-50"
                      >
                        <AlertCircle size={16} className="me-1" />
                        {requestingApproval[product._id] ? t('operator.products.request_approval_sending') : t('operator.products.request_approval')}
                      </button>
                    )}
                    {product.status !== 'Pending Review' && (
                      <button
                        onClick={() => handleTogglePublish(product)}
                        className={`flex items-center ${
                          product.status === 'Published' ? 'text-amber-700 hover:text-amber-800' : 'text-primary-600 hover:text-primary-700'
                        } transition`}
                      >
                        {product.status === 'Published' ? (
                          <>
                            <PauseCircle size={16} className="me-1" />
                            {t('operator.products.unpublish')}
                          </>
                        ) : (
                          <>
                            <Rocket size={16} className="me-1" />
                            {t('operator.products.publish')}
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setBadgeRequestModal({ isOpen: true, productId: product._id, productTitle: product.title })}
                      className="flex items-center text-slate-700 hover:text-primary-700 transition"
                      title={t('operator.products.request_badge_title')}
                    >
                      <Award size={16} className="me-1" />
                      {t('operator.products.request_badge')}
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="flex items-center text-red-600 hover:text-red-700 transition"
                    >
                      <Trash2 size={16} className="me-1" />
                      {t('operator.common.delete')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Badge Request Modal */}
      <BadgeRequestModal
        isOpen={badgeRequestModal.isOpen}
        onClose={() => setBadgeRequestModal({ isOpen: false, productId: null, productTitle: '' })}
        productId={badgeRequestModal.productId}
        productTitle={badgeRequestModal.productTitle}
      />

      <ScrollToTopButton />
    </div>
  );
};

export default OperatorProductsPage;
