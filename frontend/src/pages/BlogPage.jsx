import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../config/axios';
import BlogCard from '../components/BlogCard';
import { Filter, Search, TrendingUp, Calendar } from 'lucide-react';

const BlogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
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

  return (
    <div className="min-h-screen bg-slate-50 py-12 pt-24">
      <Helmet>
        <title>Blog - Conseils, Guides et Actualités | Overglow Trip</title>
        <meta name="description" content="Découvrez nos articles sur les destinations, conseils de voyage, culture marocaine et bien plus encore" />
        <meta property="og:title" content="Blog Overglow Trip - Conseils et Guides de Voyage" />
        <meta property="og:description" content="Découvrez nos articles sur les destinations, conseils de voyage, culture marocaine et bien plus encore" />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Helmet>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Blog Overglow Trip
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Conseils, guides et actualités pour découvrir le Maroc autrement
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => handleFilterChange('category', '')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  !selectedCategory
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Toutes les catégories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleFilterChange('category', cat)}
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
          )}

          {/* Tags Filter */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {tags.slice(0, 10).map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleFilterChange('tag', tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    selectedTag === tag
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Sort and Featured */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleFilterChange('featured', '')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                featuredOnly
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <TrendingUp size={18} />
              À la une
            </button>
            <select
              value={sortBy}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="publishedAt">Plus récent</option>
              <option value="views">Plus populaire</option>
              <option value="title">Titre A-Z</option>
            </select>
          </div>
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
            <p className="text-slate-600 text-lg mb-4">Aucun article trouvé</p>
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedTag('');
                setSearchQuery('');
                setFeaturedOnly(false);
                setPage(1);
              }}
              className="text-primary-600 font-semibold hover:underline"
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
