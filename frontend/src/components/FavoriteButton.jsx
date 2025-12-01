import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';

const FavoriteButton = ({ productId, listName = 'default', size = 24, showText = false }) => {
  const { isAuthenticated } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);

  useEffect(() => {
    if (isAuthenticated && productId) {
      checkFavorite();
    }
  }, [isAuthenticated, productId]);

  const checkFavorite = async () => {
    try {
      const { data } = await api.get(`/api/favorites/check/${productId}`);
      setIsFavorited(data.isFavorited);
      setFavoriteId(data.favorite?._id || null);
    } catch (error) {
      // Silently fail - favorites are optional
    }
  };

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      alert('Veuillez vous connecter pour ajouter aux favoris');
      return;
    }

    setLoading(true);

    try {
      if (isFavorited && favoriteId) {
        // Remove from favorites
        await api.delete(`/api/favorites/${favoriteId}`);
        setIsFavorited(false);
        setFavoriteId(null);
      } else {
        // Add to favorites
        const { data } = await api.post('/api/favorites', {
          productId,
          listName,
        });
        setIsFavorited(true);
        setFavoriteId(data._id);
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'ajout aux favoris');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 transition ${
        isFavorited
          ? 'text-red-600 hover:text-red-700'
          : 'text-gray-400 hover:text-red-600'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      title={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart
        size={size}
        className={isFavorited ? 'fill-current' : ''}
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

