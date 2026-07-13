import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import ProductCard from '../components/ProductCard';
import { MapPin } from 'lucide-react';

const categoryIcons = {
  Tours: '🗺️',
  Attractions: '🎡',
  'Day Trips': '🚌',
  'Outdoor Activities': '🏔️',
  'Shows & Performances': '🎭',
  'Food & Drink': '🍷',
  'Classes & Workshops': '🎨',
};

const CategoryPage = () => {
  const { category } = useParams();
  const { t } = useTranslation();
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

        const uniqueCities = [...new Set(data.products?.map((p) => p.city).filter(Boolean) || [])];
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

  const categoryName = t(`category.items.${category}.name`, { defaultValue: category });
  const categoryDescription = t(`category.items.${category}.description`, {
    defaultValue: `Découvrez les meilleures expériences ${category} au Maroc`,
  });
  const categoryIcon = categoryIcons[category] || '✨';

  const getCityName = (city) => t(`destination.cities.${city}.name`, { defaultValue: city });

  const sectionTitle = selectedCity
    ? t('category.in_city', { name: categoryName, city: getCityName(selectedCity) })
    : t('category.in_morocco', { name: categoryName });

  return (
    <div className="bg-slate-50 min-h-screen">
      <Helmet>
        <title>{t('category.meta_title', { name: categoryName })}</title>
        <meta name="description" content={categoryDescription} />
        <meta property="og:title" content={t('category.meta_title', { name: categoryName })} />
        <meta property="og:description" content={categoryDescription} />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Helmet>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{categoryIcon}</span>
            <h1 className="text-4xl md:text-5xl font-bold">{categoryName}</h1>
          </div>
          <p className="text-xl text-primary-50 max-w-2xl">{categoryDescription}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* City Filter */}
        {cities.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={20} />
              <h3 className="font-bold text-lg">{t('category.filter_city')}</h3>
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
                {t('category.all')}
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
                  {getCityName(city)}
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
              <h2 className="text-2xl font-bold">{sectionTitle}</h2>
              <p className="text-slate-600">
                {t('category.count', { count: products.length })}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-slate-600 text-lg">{t('category.empty')}</p>
            <Link to="/search" className="text-primary-600 hover:underline mt-4 inline-block">
              {t('category.see_all')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
