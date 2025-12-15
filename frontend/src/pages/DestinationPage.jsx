import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../config/axios';
import ProductCard from '../components/ProductCard';
import { MapPin, Star, Filter } from 'lucide-react';

const DestinationPage = () => {
  const { city } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        params.append('city', city);
        if (selectedCategory) {
          params.append('category', selectedCategory);
        }
        params.append('limit', '20');

        const { data } = await api.get(`/api/search/advanced?${params.toString()}`);
        setProducts(Array.isArray(data.products) ? data.products : []);
        
        // Get unique categories from products
        const uniqueCategories = [...new Set(data.products?.map(p => p.category).filter(Boolean) || [])];
        setCategories(uniqueCategories);
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load products:', error);
        setProducts([]);
        setLoading(false);
      }
    };

    fetchData();
  }, [city, selectedCategory]);

  const cityInfo = {
    'Marrakech': {
      name: 'Marrakech',
      description: 'Découvrez la perle du Sud marocain avec ses souks animés, ses palais historiques et ses expériences authentiques.',
      highlights: ['Place Jemaa el-Fnaa', 'Palais Bahia', 'Jardin Majorelle', 'Souks traditionnels'],
      image: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200'
    },
    'Casablanca': {
      name: 'Casablanca',
      description: 'Explorez la capitale économique du Maroc, mélange de modernité et de tradition.',
      highlights: ['Mosquée Hassan II', 'Corniche', 'Médina', 'Art déco'],
      image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200'
    },
    'Fès': {
      name: 'Fès',
      description: 'Plongez dans l\'histoire millénaire de la capitale spirituelle du Maroc.',
      highlights: ['Médina de Fès', 'Tanneries', 'Université Al Quaraouiyine', 'Palais Royal'],
      image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200'
    },
    'Rabat': {
      name: 'Rabat',
      description: 'Visitez la capitale administrative avec ses monuments historiques et sa modernité.',
      highlights: ['Kasbah des Oudayas', 'Tour Hassan', 'Chellah', 'Médina'],
      image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200'
    },
    'Tanger': {
      name: 'Tanger',
      description: 'Découvrez la porte de l\'Afrique avec ses influences méditerranéennes.',
      highlights: ['Kasbah', 'Grottes d\'Hercule', 'Cap Spartel', 'Médina'],
      image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200'
    },
    'Agadir': {
      name: 'Agadir',
      description: 'Profitez du soleil et des plages de la station balnéaire du Sud.',
      highlights: ['Plage d\'Agadir', 'Kasbah', 'Vallée du Paradis', 'Souk El Had'],
      image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200'
    },
  };

  const info = cityInfo[city] || {
    name: city,
    description: `Découvrez les meilleures expériences et activités à ${city}`,
    highlights: [],
    image: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200'
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <Helmet>
        <title>Expériences à {info.name} | Overglow Trip</title>
        <meta name="description" content={info.description} />
        <meta property="og:title" content={`Expériences à ${info.name} | Overglow Trip`} />
        <meta property="og:description" content={info.description} />
        <meta property="og:image" content={info.image} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      {/* Hero Section */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        <img 
          src={info.image} 
          alt={info.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">{info.name}</h1>
          <p className="text-lg md:text-xl">{info.description}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Highlights */}
        {info.highlights.length > 0 && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">À ne pas manquer</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {info.highlights.map((highlight, idx) => (
                <div key={idx} className="flex items-center text-slate-700">
                  <MapPin size={16} className="text-primary-600 mr-2" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={20} />
              <h3 className="font-bold text-lg">Filtrer par catégorie</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  !selectedCategory
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Toutes
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
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
                {selectedCategory ? `${selectedCategory} à ${info.name}` : `Expériences à ${info.name}`}
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

export default DestinationPage;

