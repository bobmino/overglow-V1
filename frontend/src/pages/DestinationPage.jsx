import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import LocalizedLink from '../components/LocalizedLink';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import ProductCard from '../components/ProductCard';
import DestinationGuide from '../components/DestinationGuide';
import SEOHead from '../components/SEOHead';
import { MapPin, Filter, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { logger } from '../utils/logger.js';
import { getCityImage, getCityAlt } from '../config/cityMedia.js';

/**
 * Destination landing — copy from i18n only (no hardcoded FR city essays).
 * Optional keys under destination.cities.{city}: fullDescription, highlights[], guide{}
 */
const DestinationPage = () => {
  const { city: cityKey } = useParams();
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        params.append('city', cityKey);
        if (selectedCategory) {
          params.append('category', selectedCategory);
        }
        params.append('limit', '20');

        const { data } = await api.get(`/api/search/advanced?${params.toString()}`);
        setProducts(Array.isArray(data.products) ? data.products : []);

        const uniqueCategories = [
          ...new Set(data.products?.map((p) => p.category).filter(Boolean) || []),
        ];
        setCategories(uniqueCategories);

        setLoading(false);
      } catch (error) {
        logger.error('Failed to load products:', error);
        setProducts([]);
        setLoading(false);
      }
    };

    fetchData();
  }, [cityKey, selectedCategory]);

  const displayName = t(`destination.cities.${cityKey}.name`, { defaultValue: cityKey });
  const displayDescription = t(`destination.cities.${cityKey}.description`, {
    defaultValue: t('destination.fallback_description', { city: cityKey }),
  });
  const fullDescription = t(`destination.cities.${cityKey}.fullDescription`, {
    defaultValue: '',
  });
  const highlightsRaw = t(`destination.cities.${cityKey}.highlights`, {
    returnObjects: true,
    defaultValue: [],
  });
  const highlights = Array.isArray(highlightsRaw) ? highlightsRaw : [];
  const guideRaw = t(`destination.cities.${cityKey}.guide`, {
    returnObjects: true,
    defaultValue: null,
  });
  const guide =
    guideRaw && typeof guideRaw === 'object' && !Array.isArray(guideRaw) ? guideRaw : null;

  const heroImage = getCityImage(cityKey, 'hero');

  const productsSectionTitle = selectedCategory
    ? t('destination.category_at', { category: selectedCategory, city: displayName })
    : t('destination.experiences_at', { city: displayName });

  return (
    <div className="bg-slate-50 min-h-screen">
      <SEOHead
        title={t('destination.meta_title', { city: displayName })}
        description={displayDescription}
        pathname={`/destinations/${encodeURIComponent(cityKey)}`}
        image={heroImage}
      />

      <div className="relative h-64 md:h-96 overflow-hidden">
        <img
          src={heroImage}
          alt={getCityAlt(cityKey, i18n.language)}
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 start-0 end-0 p-8 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">{displayName}</h1>
          <p className="text-lg md:text-xl">{displayDescription}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {fullDescription ? (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
            <p className="text-slate-700 leading-relaxed text-lg">{fullDescription}</p>
          </div>
        ) : null}

        {highlights.length > 0 && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">{t('destination.highlights')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {highlights.map((highlight, idx) => (
                <div key={idx} className="flex items-center text-slate-700">
                  <MapPin size={16} className="text-primary-600 me-2 flex-shrink-0" />
                  <span className="text-sm">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {guide && (
          <div className="mb-8">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="w-full bg-white rounded-xl p-6 shadow-sm flex items-center justify-between hover:bg-slate-50 transition"
            >
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <BookOpen size={24} />
                {t('destination.guide_title')}
              </h2>
              {showGuide ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
            {showGuide && (
              <div className="mt-4">
                <DestinationGuide city={cityKey} guide={guide} />
              </div>
            )}
          </div>
        )}

        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={20} />
              <h3 className="font-bold text-lg">{t('destination.filter_category')}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  !selectedCategory
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {t('destination.all')}
              </button>
              {categories.map((cat) => (
                <button
                  type="button"
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

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{productsSectionTitle}</h2>
              <p className="text-slate-600">{t('destination.count', { count: products.length })}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-slate-600 text-lg">{t('destination.empty')}</p>
            <LocalizedLink to="/search" className="text-primary-600 hover:underline mt-4 inline-block">
              {t('destination.see_all')}
            </LocalizedLink>
          </div>
        )}
      </div>
    </div>
  );
};

export default DestinationPage;
