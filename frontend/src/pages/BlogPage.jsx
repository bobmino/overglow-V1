import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../config/axios';
import BlogCard from '../components/BlogCard';
import { Search, TrendingUp, X } from 'lucide-react';

const BlogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [featuredOnly, setFeaturedOnly] = useState(searchParams.get('featured') === 'true');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'publishedAt');

  // Fetch categories and tags
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          api.get('/api/blog/categories'),
          api.get('/api/blog/tags'),
        ]);
        setCategories(categoriesRes.data.categories || []);
        setTags(tagsRes.data.tags || []);
      } catch (error) {
        console.error('Failed to fetch blog meta:', error);
      }
    };
    fetchMeta();
  }, []);

  // Fetch featured posts for homepage section (independent from filters)
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await api.get('/api/blog?featured=true&limit=6&sortBy=views');
        setFeaturedPosts(Array.isArray(data.posts) ? data.posts : []);
      } catch (error) {
        setFeaturedPosts([]);
      }
    };
    fetchFeatured();
  }, []);

  // Fetch blog posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedTag) params.append('tag', selectedTag);
        if (searchQuery) params.append('search', searchQuery);
        if (featuredOnly) params.append('featured', 'true');
        params.append('page', page);
        params.append('limit', '12');
        params.append('sortBy', sortBy);

        const { data } = await api.get(`/api/blog?${params.toString()}`);
        setPosts(data.posts || []);
        setTotalPages(data.pagination?.totalPages || 1);

        // Update URL params
        const newParams = new URLSearchParams();
        if (selectedCategory) newParams.set('category', selectedCategory);
        if (selectedTag) newParams.set('tag', selectedTag);
        if (searchQuery) newParams.set('search', searchQuery);
        if (featuredOnly) newParams.set('featured', 'true');
        if (page > 1) newParams.set('page', page);
        if (sortBy !== 'publishedAt') newParams.set('sort', sortBy);
        setSearchParams(newParams);
      } catch (error) {
        console.error('Failed to fetch blog posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [selectedCategory, selectedTag, searchQuery, featuredOnly, page, sortBy, setSearchParams]);

  const handleFilterChange = (filterType, value) => {
    setPage(1);
    if (filterType === 'category') {
      setSelectedCategory(value === selectedCategory ? '' : value);
      setSelectedTag(''); // Reset tag when category changes
    } else if (filterType === 'tag') {
      setSelectedTag(value === selectedTag ? '' : value);
    } else if (filterType === 'featured') {
      setFeaturedOnly(!featuredOnly);
    } else if (filterType === 'sort') {
      setSortBy(value);
    }
  };

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedTag('');
    setSearchQuery('');
    setFeaturedOnly(false);
    setPage(1);
    setSortBy('publishedAt');
  };

  const hasActiveFilters = !!(selectedCategory || selectedTag || searchQuery || featuredOnly || sortBy !== 'publishedAt');

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <Helmet>
        <title>Blog - Conseils, Guides et Actualités | Overglow Trip</title>
        <meta name="description" content="Découvrez nos articles sur les destinations, conseils de voyage, culture marocaine et bien plus encore" />
        <meta property="og:title" content="Blog Overglow Trip - Conseils et Guides de Voyage" />
        <meta property="og:description" content="Découvrez nos articles sur les destinations, conseils de voyage, culture marocaine et bien plus encore" />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Helmet>

      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-slate-900 text-white p-8 md:p-12 mb-10">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35) 0, rgba(255,255,255,0) 40%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.25) 0, rgba(255,255,255,0) 45%)"
          }} />
          <div className="relative">
            <p className="text-white/80 text-sm font-semibold tracking-wide uppercase mb-3">
              Inspiration • Conseils • Guides
            </p>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
              Le blog Overglow Trip
            </h1>
            <p className="text-white/90 text-base md:text-lg max-w-2xl">
              Des idées concrètes et des articles utiles pour découvrir le Maroc autrement — plus authentique, plus malin, plus mémorable.
            </p>

            {/* Search bar */}
            <div className="mt-7 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher un article (ex: Marrakech, gastronomie, désert...)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-white/30 focus:ring-4 focus:ring-white/20 outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-slate-100 transition text-slate-500"
                    aria-label="Effacer la recherche"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              {hasActiveFilters && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-white/80 font-semibold">Filtres actifs :</span>
                  {selectedCategory && <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20">Catégorie: {selectedCategory}</span>}
                  {selectedTag && <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20">Tag: #{selectedTag}</span>}
                  {featuredOnly && <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20">À la une</span>}
                  {sortBy !== 'publishedAt' && <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20">Tri: {sortBy}</span>}
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="ml-auto px-4 py-2 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition"
                  >
                    Réinitialiser
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Featured/Trending */}
        {Array.isArray(featuredPosts) && featuredPosts.length > 0 && !hasActiveFilters && (
          <div className="mb-10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp size={20} className="text-primary-600" />
                Tendance
              </h2>
              <button
                type="button"
                onClick={() => handleFilterChange('featured', '')}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Voir “À la une”
              </button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPosts.map((post) => (
                <BlogCard key={post._id || post.slug} post={post} />
              ))}
            </div>
          </div>
        )}

        {/* Explore by category */}
        {Array.isArray(categories) && categories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-3">
              Explorer par catégorie
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              <button
                onClick={() => handleFilterChange('category', '')}
                className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold transition border ${
                  !selectedCategory ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Tous
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleFilterChange('category', cat)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold transition border ${
                    selectedCategory === cat ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Explore by tags */}
        {Array.isArray(tags) && tags.length > 0 ? (
          <div className="mb-10">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-3">
              Explorer par intérêt
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {tags.slice(0, 20).map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleFilterChange('tag', tag)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition border ${
                    selectedTag === tag ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-10 bg-white border border-slate-200 rounded-2xl p-5 text-slate-700">
            <p className="font-bold text-slate-900 mb-1">Tags indisponibles</p>
            <p className="text-sm text-slate-600">
              Les tags sont calculés à partir des <span className="font-semibold">articles publiés</span>. Publie au moins un article avec des tags (ex: “Gastronomie”, “Éco”, “Désert”) pour les voir apparaître ici.
            </p>
          </div>
        )}

        {/* Sort + featured toggle */}
        <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            onClick={() => handleFilterChange('featured', '')}
            className={`px-4 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 border ${
              featuredOnly ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <TrendingUp size={18} />
            À la une
          </button>
          <select
            value={sortBy}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-4 focus:ring-primary-100 outline-none"
          >
            <option value="publishedAt">Plus récent</option>
            <option value="views">Plus populaire</option>
            <option value="title">Titre A-Z</option>
          </select>
        </div>

        {/* Blog Posts Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl h-96 animate-pulse">
                <div className="h-48 bg-slate-200"></div>
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {posts.map((post) => (
                <BlogCard key={post._id || post.slug} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
                >
                  Précédent
                </button>
                <span className="px-4 py-2 text-slate-700">
                  Page {page} sur {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-900 text-xl font-extrabold mb-2">Aucun article trouvé</p>
            <p className="text-slate-600 mb-5">
              Si tu viens de créer des articles, assure-toi qu’ils sont <span className="font-semibold">publiés</span> (sinon ils n’apparaissent pas ici).
            </p>
            <button
              onClick={clearAllFilters}
              className="px-6 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
