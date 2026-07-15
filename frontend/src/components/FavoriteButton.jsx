import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { trackFavorite } from '../utils/analytics';
import { useWishlist } from '../context/WishlistContext';
import { logger } from '../utils/logger.js';

const FavoriteButton = ({ productId, product, listName: _listName = 'default', size = 24, showText = false }) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [loading, setLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  
  // Keep local state in sync with context
  useEffect(() => {
    if (productId) {
      setIsFavorited(isInWishlist(productId));
    }
  }, [productId, isInWishlist]);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!productId) return;

    setLoading(true);

    try {
      if (isFavorited) {
        removeFromWishlist(productId);
        setIsFavorited(false);
        // Track favorite removal
        if (product) {
          trackFavorite(product, false);
        }
      } else {
        addToWishlist(productId);
        setIsFavorited(true);
        // Track favorite addition
        if (product) {
          trackFavorite(product, true);
        }
      }
    } catch (error) {
      logger.error('Toggle favorite error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 transition ${
        isFavorited
          ? 'text-red-600 hover:text-red-700'
          : 'text-gray-400 hover:text-red-600'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      title={isFavorited ? 'Retirer des coups de cœur' : 'Ajouter aux coups de cœur'}
    >
      <Heart
        size={size}
        className={isFavorited ? 'fill-current text-red-600' : 'text-gray-400'}
      />
      {showText && (
        <span className="text-sm font-medium">
          {isFavorited ? 'Retirer' : 'Ajouter aux favoris'}
        </span>
      )}
    </button>
  );
};

export default FavoriteButton;
