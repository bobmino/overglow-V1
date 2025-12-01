import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import ProductCard from '../components/ProductCard';
import { Clock, Trash2 } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

const ViewHistoryPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchViewHistory();
  }, []);

  const fetchViewHistory = async () => {
    try {
      const { data } = await api.get('/api/view-history');
      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch view history:', error);
      setProducts([]);
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir effacer tout l\'historique de navigation ?')) {
      return;
    }
    
    try {
      await api.delete('/api/view-history');
      setProducts([]);
      alert('Historique effacé avec succès');
    } catch (error) {
      console.error('Failed to clear history:', error);
      alert('Erreur lors de l\'effacement de l\'historique');
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Clock size={32} />
            Produits Récemment Consultés
          </h1>
          <p className="text-gray-600 mt-2">
            {products.length} produit{products.length > 1 ? 's' : ''} consulté{products.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          {products.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
            >
              <Trash2 size={18} />
              Effacer l'historique
            </button>
          )}
          <DashboardNavBar />
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Clock size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun historique</h2>
          <p className="text-gray-600">
            Vous n'avez pas encore consulté de produits. Commencez à explorer !
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default ViewHistoryPage;

