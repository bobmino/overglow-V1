import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, X } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';
import api from '../config/axios';
import { logger } from '../utils/logger.js';

const FavoritesPage = () => {
  const { t } = useTranslation();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch product details for all wishlist IDs
  useEffect(() => {
    const fetchProducts = async () => {
      if (wishlistItems.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch each product individually (they're cached by react-query or browser)
        const results = await Promise.allSettled(
          wishlistItems.map((id) => api.get(`/api/products/${id}`))
        );

        const fetched = results
          .filter((r) => r.status === 'fulfilled' && r.value?.data)
          .map((r) => r.value.data.product || r.value.data);

        setProducts(fetched);
      } catch (error) {
        logger.error('Failed to fetch wishlist products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [wishlistItems]);

  const handleRemove = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromWishlist(productId);
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('favorites.title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('favorites.saved', { count: wishlistItems.length })}
          </p>
        </div>
        <DashboardNavBar />
      </div>

      {products.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Heart size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('favorites.empty_title')}</h2>
          <p className="text-gray-600 mb-6">
            {t('favorites.empty_body')}
          </p>
          <a
            href="/search"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-700 transition"
          >
            {t('favorites.explore')}
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product._id} className="relative">
              <ProductCard product={product} />
              <button
                onClick={(e) => handleRemove(e, product._id)}
                className="absolute top-4 end-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition z-10"
                title={t('favorites.remove_title')}
              >
                <X size={18} className="text-red-600" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default FavoritesPage;
