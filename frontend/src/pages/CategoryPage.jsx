import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../config/axios';
import ProductCard from '../components/ProductCard';
import { Filter, MapPin } from 'lucide-react';

const CategoryPage = () => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        params.append('category', category);
        if (selectedCity) {
          params.append('city', selectedCity);
        }
        params.append('limit', '20');

        const { data } = await api.get(`/api/search/advanced?${params.toString()}`);
        setProducts(Array.isArray(data.products) ? data.products : []);
        
        // Get unique cities from products
        const uniqueCities = [...new Set(data.products?.map(p => p.city).filter(Boolean) || [])];
        setCities(uniqueCities);
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load products:', error);
        setProducts([]);
        setLoading(false);
      }
    };

    fetchData();
  }, [category, selectedCity]);

  const categoryInfo = {
    'Tours': {
      name: 'Tours',
      description: 'Découvrez les meilleurs tours guidés au Maroc avec des guides locaux expérimentés.',
      icon: '🗺️'
    },
    'Attractions': {
      name: 'Attractions',
      description: 'Visitez les attractions incontournables du Maroc.',
      icon: '🎡'
    },
    'Day Trips': {
      name: 'Excursions d\'une journée',
      description: 'Explorez les environs avec nos excursions d\'une journée.',
      icon: '🚌'
    },
    'Outdoor Activities': {
      name: 'Activités de plein air',
      description: 'Aventurez-vous dans la nature marocaine.',
      icon: '🏔️'
    },
    'Shows & Performances': {
      name: 'Spectacles et représentations',
      description: 'Découvrez la culture marocaine à travers ses spectacles.',
      icon: '🎭'
    },
    'Food & Drink': {
      name: 'Gastronomie',
      description: 'Savourez les délices de la cuisine marocaine authentique.',
      icon: '🍷'
    },
    'Classes & Workshops': {
      name: 'Cours et ateliers',
      description: 'Apprenez les arts et traditions marocains.',
      icon: '🎨'
    },
  };

  const info = categoryInfo[category] || {
    name: category,
    description: `Découvrez les meilleures expériences ${category} au Maroc`,
    icon: '✨'
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{info.icon}</span>
            <h1 className="text-4xl md:text-5xl font-bold">{info.name}</h1>
          </div>
          <p className="text-xl text-primary-50 max-w-2xl">{info.description}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* City Filter */}
        {cities.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={20} />
              <h3 className="font-bold text-lg">Filtrer par destination</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCity('')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  !selectedCity
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Toutes
              </button>
              {cities.map((city) => (
                <Link
                  key={city}
                  to={`/destinations/${city}`}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedCity === city
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">
                {selectedCity ? `${info.name} à ${selectedCity}` : `${info.name} au Maroc`}
              </h2>
              <p className="text-slate-600">{products.length} expérience{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-slate-600 text-lg">Aucune expérience disponible pour le moment.</p>
            <Link to="/search" className="text-primary-600 hover:underline mt-4 inline-block">
              Voir toutes les expériences
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;

