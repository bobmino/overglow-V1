import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';
import { FileText, CheckCircle, Clock, Eye, Plus, Edit, Trash2, X, Link as LinkIcon } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';
import { useToast } from '../context/ToastContext';

const AdminBlogPage = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [previewPost, setPreviewPost] = useState(null);
  const [copyStatus, setCopyStatus] = useState({ postId: null, ok: false, message: '' }); // keep for button label state
  const [actionLoading, setActionLoading] = useState({}); // { [postId]: { publish?: boolean, delete?: boolean } }

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


  const handleTogglePublish = async (postId, currentStatus) => {
    try {
      setActionLoading((prev) => ({
        ...prev,
        [postId]: { ...(prev[postId] || {}), publish: true },
      }));
      await api.put(`/api/blog/${postId}`, {
        isPublished: !currentStatus,
        publishedAt: !currentStatus ? new Date() : null,
      });
      toast(!currentStatus ? 'Article publié ✅' : 'Article dépublié', { type: 'success' });
      fetchPosts();
    } catch (error) {
      console.error('Failed to update post status:', error);
      toast('Erreur lors de la mise à jour du statut', { type: 'error' });
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [postId]: { ...(prev[postId] || {}), publish: false },
      }));
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      return;
    }

    try {
      setActionLoading((prev) => ({
        ...prev,
        [postId]: { ...(prev[postId] || {}), delete: true },
      }));
      await api.delete(`/api/blog/${postId}`);
      toast('Article supprimé', { type: 'success' });
      fetchPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast('Erreur lors de la suppression', { type: 'error' });
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [postId]: { ...(prev[postId] || {}), delete: false },
      }));
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return '';
    }
  };

  const getPublicUrlForPost = (post) => {
    // Prefer frontend origin if running in browser; fallback to production frontend
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://overglow-v1-3jqp.vercel.app';
    return `${origin}/blog/${post.slug}`;
  };

  const handleCopyLink = async (post) => {
    const url = getPublicUrlForPost(post);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      toast('Lien copié !', { type: 'success' });
      setCopyStatus({ postId: post._id, ok: true, message: 'Copié !' });
      setTimeout(() => setCopyStatus({ postId: null, ok: false, message: '' }), 1500);
    } catch (err) {
      console.error('Copy link failed:', err);
      toast('Impossible de copier le lien', { type: 'error' });
      setCopyStatus({ postId: post._id, ok: false, message: 'Erreur' });
      setTimeout(() => setCopyStatus({ postId: null, ok: false, message: '' }), 1800);
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
        <h1 className="text-3xl font-bold text-gray-900">Gestion du Blog</h1>
        <DashboardNavBar />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
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
          <Link
            to="/admin/blog/new"
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Créer le premier article
          </Link>
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
                  {!post.isPublished && (
                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                      Cet article est en <span className="font-semibold">brouillon</span> : il n’apparaît pas sur la page publique <span className="font-semibold">/blog</span>.
                    </div>
                  )}
                  {post.isPublished && (
                    <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
                      ✅ Visible sur <span className="font-semibold">/blog</span>
                    </div>
                  )}
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
                        {formatDate(post.publishedAt)}
                      </>
                    )}
                    {post.views !== undefined && (
                      <>
                        <br />
                        <span className="font-semibold">Vues:</span> {post.views}
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewPost(post)}
                      className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                      title="Prévisualiser (même en brouillon)"
                    >
                      <Eye size={16} />
                      <span className="hidden sm:inline">Prévisualiser</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(post)}
                      className={`px-3 py-2 bg-white border rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                        copyStatus.postId === post._id && copyStatus.ok
                          ? 'border-green-300 text-green-700 bg-green-50'
                          : copyStatus.postId === post._id && !copyStatus.ok && copyStatus.message
                            ? 'border-red-300 text-red-700 bg-red-50'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                      title="Copier le lien public"
                    >
                      <LinkIcon size={16} />
                      <span className="hidden sm:inline">
                        {copyStatus.postId === post._id && copyStatus.message ? copyStatus.message : 'Copier le lien'}
                      </span>
                    </button>
                    <Link
                      to={`/blog/${post.slug}`}
                      target="_blank"
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
                      title="Voir l'article"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link
                      to={`/admin/blog/${post._id}/edit`}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      title="Modifier l'article"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => handleTogglePublish(post._id, post.isPublished)}
                      disabled={!!actionLoading[post._id]?.publish}
                      className={`px-3 py-2 rounded-lg font-semibold transition ${
                        post.isPublished
                          ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      } ${actionLoading[post._id]?.publish ? 'opacity-60 cursor-not-allowed' : ''}`}
                      title={post.isPublished ? 'Dépublier' : 'Publier'}
                    >
                      {actionLoading[post._id]?.publish ? '...' : post.isPublished ? 'Dépublier' : 'Publier'}
                    </button>
                    <button
                      onClick={() => handleDelete(post._id)}
                      disabled={!!actionLoading[post._id]?.delete}
                      className={`px-3 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center ${
                        actionLoading[post._id]?.delete ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                      title="Supprimer l'article"
                    >
                      <Trash2 size={16} />
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

      {/* Preview modal */}
      {previewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-200">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-primary-600 uppercase">{previewPost.category}</span>
                  {getStatusBadge(previewPost.isPublished)}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{previewPost.title}</h2>
                <p className="text-xs text-gray-500">
                  {previewPost.publishedAt ? `Publié: ${formatDate(previewPost.publishedAt)}` : `Créé: ${formatDate(previewPost.createdAt)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPost(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[70vh]">
              {previewPost.featuredImage && (
                <img
                  src={previewPost.featuredImage}
                  alt={previewPost.title}
                  className="w-full h-56 sm:h-72 object-cover rounded-xl mb-5"
                />
              )}
              {previewPost.excerpt && (
                <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-sm text-slate-700">{previewPost.excerpt}</p>
                </div>
              )}
              <div
                className="prose prose-sm sm:prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-primary-600 prose-strong:text-slate-900 prose-img:rounded-lg"
                dangerouslySetInnerHTML={{ __html: previewPost.content || '<p><em>Aucun contenu</em></p>' }}
              />
            </div>

            <div className="p-5 border-t border-gray-200 flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => handleCopyLink(previewPost)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition inline-flex items-center gap-2"
              >
                <LinkIcon size={16} />
                Copier le lien
              </button>
              <Link
                to={`/admin/blog/${previewPost._id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                onClick={() => setPreviewPost(null)}
              >
                Modifier
              </Link>
              <button
                type="button"
                onClick={() => setPreviewPost(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default AdminBlogPage;

