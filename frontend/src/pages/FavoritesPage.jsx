import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import { Heart, X, Plus, FolderPlus, Share2, Copy, AlertCircle } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState('all');
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState('');
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState([]);
  const [shareUrl, setShareUrl] = useState(null);

  useEffect(() => {
    fetchFavorites();
    fetchLists();
    fetchPriceAlerts();
  }, [selectedList]);

  const fetchPriceAlerts = async () => {
    try {
      const { data } = await api.get('/api/favorites/price-alerts');
      setPriceAlerts(Array.isArray(data.alerts) ? data.alerts : []);
    } catch (error) {
      console.error('Failed to fetch price alerts:', error);
    }
  };

  const handleShareList = async (listName) => {
    try {
      const { data } = await api.post(`/api/favorites/lists/${listName}/share`);
      setShareUrl(data.shareUrl);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(data.shareUrl);
      alert('Lien de partage copié dans le presse-papiers !');
    } catch (error) {
      console.error('Failed to share list:', error);
      alert('Erreur lors du partage de la liste');
    }
  };

  const fetchFavorites = async () => {
    try {
      const params = selectedList !== 'all' ? { listName: selectedList } : {};
      const { data } = await api.get('/api/favorites', { params });
      setFavorites(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      setLoading(false);
    }
  };

  const fetchLists = async () => {
    try {
      const { data } = await api.get('/api/favorites/lists');
      setLists(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    }
  };

  const handleRemoveFavorite = async (favoriteId) => {
    try {
      await api.delete(`/api/favorites/${favoriteId}`);
      fetchFavorites();
      fetchLists();
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    try {
      // Create list by adding a favorite to it (we'll use the first favorite if any)
      if (favorites.length > 0) {
        await api.post('/api/favorites', {
          productId: favorites[0].product._id,
          listName: newListName.trim(),
        });
      }
      setNewListName('');
      setShowNewListInput(false);
      fetchLists();
      fetchFavorites();
    } catch (error) {
      console.error('Failed to create list:', error);
      alert('Erreur lors de la création de la liste');
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Mes Favoris</h1>
          <p className="text-gray-600 mt-1">
            {favorites.length} produit{favorites.length > 1 ? 's' : ''} sauvegardé{favorites.length > 1 ? 's' : ''}
          </p>
        </div>
        <DashboardNavBar />
      </div>

      {/* Price Alerts */}
      {priceAlerts.length > 0 && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={20} className="text-green-600" />
            <h3 className="font-bold text-green-900">Alertes de Prix ({priceAlerts.length})</h3>
          </div>
          <div className="space-y-2">
            {priceAlerts.slice(0, 3).map((alert) => (
              <div key={alert.favoriteId} className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{alert.product?.title}</p>
                    <p className="text-sm text-gray-600">
                      Prix réduit de {alert.discount}% ! Économisez {alert.savings.toFixed(2)}€
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 line-through">€{alert.oldPrice.toFixed(2)}</p>
                    <p className="text-lg font-bold text-green-600">€{alert.currentPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lists Filter */}
      <div className="mb-6 flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setSelectedList('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            selectedList === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tous ({favorites.length})
        </button>
        
        {Array.isArray(lists) && lists.map((list) => (
          <div key={list.name} className="flex items-center gap-2">
            <button
              onClick={() => setSelectedList(list.name)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                selectedList === list.name
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {list.name === 'default' ? 'Favoris' : list.name} ({list.count})
            </button>
            {list.name !== 'default' && (
              <button
                onClick={() => handleShareList(list.name)}
                className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition"
                title="Partager cette liste"
              >
                <Share2 size={18} />
              </button>
            )}
          </div>
        ))}

        {!showNewListInput ? (
          <button
            onClick={() => setShowNewListInput(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
          >
            <Plus size={18} />
            Nouvelle liste
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Nom de la liste"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateList();
                }
              }}
            />
            <button
              onClick={handleCreateList}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Créer
            </button>
            <button
              onClick={() => {
                setShowNewListInput(false);
                setNewListName('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Heart size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun favori</h2>
          <p className="text-gray-600 mb-6">
            {selectedList === 'all'
              ? 'Commencez à explorer et ajoutez vos expériences préférées aux favoris !'
              : 'Cette liste est vide'}
          </p>
          <a
            href="/search"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-700 transition"
          >
            Explorer les Expériences
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite) => (
            <div key={favorite._id} className="relative">
              <ProductCard product={favorite.product} />
              <button
                onClick={() => handleRemoveFavorite(favorite._id)}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition z-10"
                title="Retirer des favoris"
              >
                <X size={18} className="text-red-600" />
              </button>
              {favorite.listName && favorite.listName !== 'default' && (
                <div className="absolute top-4 left-4 bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
                  {favorite.listName}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default FavoritesPage;

