import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { Plus, Edit, Trash2, Eye, Package, Rocket, PauseCircle, AlertCircle, Award } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';
import BadgeRequestModal from '../components/BadgeRequestModal';
import { formatImageUrlWithFallback } from '../utils/formatImage';
import { logger } from '../utils/logger.js';

const OperatorProductsPage = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingApproval, setRequestingApproval] = useState({});
  const [badgeRequestModal, setBadgeRequestModal] = useState({ isOpen: false, productId: null, productTitle: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/api/products/my-products');
      setProducts(data);
      setLoading(false);
    } catch (error) {
      logger.error('Failed to fetch products:', error);
      setLoading(false);
    }
  };

  const getProductStatusLabel = (status) => {
    if (status === 'Published') return t('operator.products.status_published');
    if (status === 'Pending Review') return t('operator.products.status_pending_review');
    return t('operator.products.status_draft');
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('operator.products.confirm_delete'))) return;

    try {
      await api.delete(`/api/products/${id}`);
      fetchProducts();
    } catch (error) {
      alert(t('operator.products.delete_error'));
    }
  };

  const handleTogglePublish = async (product) => {
    const nextStatus = product.status === 'Published' ? 'Draft' : 'Published';
    try {
      const payload = {
        title: product.title,
        description: product.description,
        category: product.category,
        city: product.city,
        address: product.address,
        duration: product.duration,
        price: product.price,
        images: product.images,
        highlights: product.highlights,
        included: product.included,
        requirements: product.requirements,
        status: nextStatus,
      };
      await api.put(`/api/products/${product._id}`, payload);
      fetchProducts();
    } catch (error) {
      alert(t('operator.products.status_update_error'));
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
        <h1 className="text-3xl font-bold text-gray-900">{t('operator.products.title')}</h1>
        <DashboardNavBar />
      </div>

      <div className="flex justify-end mb-8">
        <Link
          to="/operator/products/new"
          className="flex items-center bg-green-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-800 transition"
        >
          <Plus size={20} className="me-2" />
          {t('operator.common.create_product')}
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('operator.products.empty_title')}</h2>
          <p className="text-gray-600 mb-6">{t('operator.products.empty_desc')}</p>
          <Link
            to="/operator/products/new"
            className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-800 transition"
          >
            {t('operator.common.create_product')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
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
                        ? 'bg-green-100 text-green-800' 
                        : product.status === 'Pending Review'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {getProductStatusLabel(product.status)}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-4 line-clamp-2">{product.description}</p>
                  <div className="flex flex-wrap gap-4">
                    <Link
                      to={`/products/${product._id}`}
                      className="flex items-center text-gray-700 hover:text-green-700 transition"
                    >
                      <Eye size={16} className="me-1" />
                      {t('operator.common.view')}
                    </Link>
                    <Link
                      to={`/operator/products/${product._id}/edit`}
                      className="flex items-center text-blue-600 hover:text-blue-700 transition"
                    >
                      <Edit size={16} className="me-1" />
                      {t('operator.common.edit')}
                    </Link>
                    {product.status === 'Pending Review' && (
                      <button
                        onClick={() => handleRequestApproval(product._id)}
                        disabled={requestingApproval[product._id]}
                        className="flex items-center text-orange-600 hover:text-orange-700 transition disabled:opacity-50"
                      >
                        <AlertCircle size={16} className="me-1" />
                        {requestingApproval[product._id] ? t('operator.products.request_approval_sending') : t('operator.products.request_approval')}
                      </button>
                    )}
                    {product.status !== 'Pending Review' && (
                      <button
                        onClick={() => handleTogglePublish(product)}
                        className={`flex items-center ${
                          product.status === 'Published' ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700'
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
                      className="flex items-center text-purple-600 hover:text-purple-700 transition"
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
