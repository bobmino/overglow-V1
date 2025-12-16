import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';
import { FileText, CheckCircle, XCircle, Clock, Eye, Plus, Sparkles } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

const AdminBlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [initializing, setInitializing] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? '' : filter;
      const url = `/api/blog/admin/all?page=${pagination.page}&limit=20${status ? `&status=${status}` : ''}`;
      const { data } = await api.get(url);
      setPosts(data.posts || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filter, pagination.page]);

  const handleInitialize = async () => {
    if (!window.confirm('Voulez-vous initialiser les articles de blog par défaut ? Les articles existants seront conservés.')) {
      return;
    }

    try {
      setInitializing(true);
      const { data } = await api.post('/api/blog/admin/initialize');
      alert(`Articles initialisés : ${data.created} créés, ${data.skipped} déjà existants. Total : ${data.totalPosts}`);
      fetchPosts();
    } catch (error) {
      console.error('Failed to initialize blog posts:', error);
      alert('Erreur lors de l\'initialisation des articles');
    } finally {
      setInitializing(false);
    }
  };

  const handleTogglePublish = async (postId, currentStatus) => {
    try {
      await api.put(`/api/blog/${postId}`, {
        isPublished: !currentStatus,
        publishedAt: !currentStatus ? new Date() : null,
      });
      fetchPosts();
    } catch (error) {
      console.error('Failed to update post status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      return;
    }

    try {
      await api.delete(`/api/blog/${postId}`);
      fetchPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (isPublished) => {
    if (isPublished) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle size={12} />
          Publié
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 flex items-center gap-1">
        <Clock size={12} />
        Brouillon
      </span>
    );
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
        <h1 className="text-3xl font-bold text-gray-900">Gestion du Blog</h1>
        <DashboardNavBar />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleInitialize}
          disabled={initializing}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition flex items-center gap-2 disabled:opacity-50"
        >
          <Sparkles size={18} />
          {initializing ? 'Initialisation...' : 'Initialiser les articles par défaut'}
        </button>
        <Link
          to="/admin/blog/new"
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
        >
          <Plus size={18} />
          Nouvel article
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => {
            setFilter('all');
            setPagination({ ...pagination, page: 1 });
          }}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tous ({pagination.total})
        </button>
        <button
          onClick={() => {
            setFilter('published');
            setPagination({ ...pagination, page: 1 });
          }}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'published' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Publiés
        </button>
        <button
          onClick={() => {
            setFilter('draft');
            setPagination({ ...pagination, page: 1 });
          }}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'draft' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Brouillons
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun article</h2>
          <p className="text-gray-600 mb-4">Aucun article trouvé avec ce filtre</p>
          <button
            onClick={handleInitialize}
            disabled={initializing}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
          >
            {initializing ? 'Initialisation...' : 'Initialiser les articles par défaut'}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div key={post._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
                {post.featuredImage && (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                {!post.featuredImage && (
                  <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    <FileText size={48} className="text-primary-400" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">{post.title}</h3>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-primary-600 uppercase">{post.category}</span>
                    {getStatusBadge(post.isPublished)}
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.tags?.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mb-4">
                    <span className="font-semibold">Auteur:</span> {post.author?.name || 'N/A'}
                    {post.publishedAt && (
                      <>
                        <br />
                        <span className="font-semibold">Publié:</span>{' '}
                        {new Date(post.publishedAt).toLocaleDateString('fr-FR')}
                      </>
                    )}
                    {post.views !== undefined && (
                      <>
                        <br />
                        <span className="font-semibold">Vues:</span> {post.views}
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/blog/${post.slug}`}
                      target="_blank"
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      Voir
                    </Link>
                    <button
                      onClick={() => handleTogglePublish(post._id, post.isPublished)}
                      className={`flex-1 px-3 py-2 rounded-lg font-semibold transition ${
                        post.isPublished
                          ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {post.isPublished ? 'Dépublier' : 'Publier'}
                    </button>
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
                disabled={pagination.page === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
              >
                Précédent
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {pagination.page} sur {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: Math.min(pagination.totalPages, pagination.page + 1) })}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default AdminBlogPage;

