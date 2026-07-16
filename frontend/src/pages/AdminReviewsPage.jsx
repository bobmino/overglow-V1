import React, { useCallback, useEffect, useState } from 'react';
import { Check, X, MessageSquare, Star, Search } from 'lucide-react';
import api from '../config/axios';
import ScrollToTopButton from '../components/ScrollToTopButton';
import EmptyState from '../components/EmptyState';
import { logger } from '../utils/logger.js';

const statusBadge = (status) => {
  const map = {
    Pending: 'bg-amber-100 text-amber-800',
    Approved: 'bg-primary-100 text-primary-800',
    Rejected: 'bg-red-100 text-red-800',
  };
  const labels = {
    Pending: 'En attente',
    Approved: 'Approuvé',
    Rejected: 'Refusé',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {labels[status] || status}
    </span>
  );
};

/**
 * [PROMPT-11] Admin review moderation center.
 */
const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    rating: '',
    status: '',
    search: '',
    page: 1,
  });
  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/reviews', {
        params: {
          rating: filters.rating || undefined,
          status: filters.status || undefined,
          search: filters.search || undefined,
          page: filters.page,
          limit: 20,
        },
      });
      setReviews(data.reviews || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      setStats(data.stats || null);
    } catch (err) {
      logger.error('Admin reviews fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id, status, reason) => {
    setBusyId(id);
    try {
      await api.put(`/api/admin/reviews/${id}/status`, { status, reason });
      await load();
    } catch (err) {
      logger.error('Update review status failed', err);
      alert(err.response?.data?.message || 'Échec de la mise à jour');
    } finally {
      setBusyId(null);
    }
  };

  const approve = (id) => setStatus(id, 'Approved');
  const reject = (id) => {
    const reason = window.prompt('Motif du refus (optionnel) :') || '';
    setStatus(id, 'Rejected', reason);
  };

  const sendReply = async (id) => {
    if (!replyText.trim()) return;
    setBusyId(id);
    try {
      await api.post(`/api/reviews/${id}/reply`, { message: replyText.trim() });
      setReplyFor(null);
      setReplyText('');
      await load();
    } catch (err) {
      logger.error('Reply failed', err);
      alert(err.response?.data?.message || 'Échec de la réponse');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 font-heading flex items-center gap-2">
          <Star className="text-amber-500" size={28} />
          Avis & modération
        </h1>
        <p className="text-gray-600 mt-1">Approuver, refuser ou répondre aux avis clients</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Note moyenne</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats?.averageRating ?? '—'} <span className="text-base font-medium text-amber-500">★</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Avis approuvés</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalApproved ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">En attente de modération</p>
          <p className="text-2xl font-bold text-amber-700">{stats?.pendingModeration ?? 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Rechercher un produit…"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select
          value={filters.rating}
          onChange={(e) => setFilters((f) => ({ ...f, rating: e.target.value, page: 1 }))}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Toutes les notes</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} ★
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Tous les statuts</option>
          <option value="Pending">En attente</option>
          <option value="Approved">Approuvé</option>
          <option value="Rejected">Refusé</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
                <th className="py-3 px-4 font-semibold">Utilisateur</th>
                <th className="py-3 px-4 font-semibold">Produit</th>
                <th className="py-3 px-4 font-semibold">Note</th>
                <th className="py-3 px-4 font-semibold">Commentaire</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Statut</th>
                <th className="py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    Chargement…
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      variant="inbox"
                      title="Aucun avis"
                      subtitle="Les avis modérés apparaîtront ici."
                    />
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <React.Fragment key={r._id}>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/80 align-top">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{r.user?.name || '—'}</div>
                        <div className="text-xs text-gray-500">{r.user?.email}</div>
                      </td>
                      <td className="py-3 px-4 max-w-[160px]">
                        <div className="truncate font-medium">{r.product?.title || '—'}</div>
                        <div className="text-xs text-gray-500">
                          {r.product?.operator?.companyName || r.product?.operator?.publicName || ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                          <Star size={14} className="fill-amber-500" />
                          {r.rating}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-[240px]">
                        <p className="line-clamp-2 text-gray-700">{r.comment}</p>
                        {r.operatorResponse?.message && (
                          <p className="mt-1 text-xs text-blue-700 line-clamp-1">
                            Réponse : {r.operatorResponse.message}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-4">{statusBadge(r.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {r.status !== 'Approved' && (
                            <button
                              type="button"
                              disabled={busyId === r._id}
                              onClick={() => approve(r._id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 disabled:opacity-50"
                            >
                              <Check size={12} /> Approuver
                            </button>
                          )}
                          {r.status !== 'Rejected' && (
                            <button
                              type="button"
                              disabled={busyId === r._id}
                              onClick={() => reject(r._id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                            >
                              <X size={12} /> Refuser
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setReplyFor(replyFor === r._id ? null : r._id);
                              setReplyText(r.operatorResponse?.message || '');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            <MessageSquare size={12} /> Répondre
                          </button>
                        </div>
                      </td>
                    </tr>
                    {replyFor === r._id && (
                      <tr className="bg-blue-50/50 border-b border-blue-100">
                        <td colSpan={7} className="px-4 py-3">
                          <label className="block text-xs font-semibold text-blue-900 mb-1">
                            Réponse de l’opérateur / admin
                          </label>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={2}
                            className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm mb-2"
                            placeholder="Écrire une réponse publique…"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={busyId === r._id || !replyText.trim()}
                              onClick={() => sendReply(r._id)}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                              Publier
                            </button>
                            <button
                              type="button"
                              onClick={() => setReplyFor(null)}
                              className="px-3 py-1.5 text-sm text-gray-600"
                            >
                              Annuler
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-10 text-center text-gray-500">Chargement…</div>
          ) : reviews.length === 0 ? (
            <EmptyState
              variant="inbox"
              title="Aucun avis"
              subtitle="Les avis modérés apparaîtront ici."
            />
          ) : (
            reviews.map((r) => (
              <article key={r._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{r.user?.name || '—'}</p>
                    <p className="text-xs text-gray-500 break-all">{r.user?.email}</p>
                  </div>
                  {statusBadge(r.status)}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Produit</p>
                  <p className="font-medium text-gray-800">{r.product?.title || '—'}</p>
                </div>
                <div className="inline-flex items-center gap-1 font-semibold text-amber-600">
                  <Star size={14} className="fill-amber-500" />
                  {r.rating}
                </div>
                <p className="line-clamp-3 text-sm text-gray-700">{r.comment}</p>
                {r.operatorResponse?.message && (
                  <p className="text-xs text-blue-700 line-clamp-2">
                    Réponse : {r.operatorResponse.message}
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  {r.status !== 'Approved' && (
                    <button
                      type="button"
                      disabled={busyId === r._id}
                      onClick={() => approve(r._id)}
                      className="min-h-11 inline-flex items-center justify-center gap-2 px-3 rounded-lg bg-primary-600 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      <Check size={16} /> Approuver
                    </button>
                  )}
                  {r.status !== 'Rejected' && (
                    <button
                      type="button"
                      disabled={busyId === r._id}
                      onClick={() => reject(r._id)}
                      className="min-h-11 inline-flex items-center justify-center gap-2 px-3 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      <X size={16} /> Refuser
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setReplyFor(replyFor === r._id ? null : r._id);
                      setReplyText(r.operatorResponse?.message || '');
                    }}
                    className="min-h-11 inline-flex items-center justify-center gap-2 px-3 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700"
                  >
                    <MessageSquare size={16} /> Répondre
                  </button>
                </div>
                {replyFor === r._id && (
                  <div className="rounded-lg bg-blue-50 p-3">
                    <label className="block text-xs font-semibold text-blue-900 mb-1">
                      Réponse de l’opérateur / admin
                    </label>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm mb-2"
                      placeholder="Écrire une réponse publique…"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        disabled={busyId === r._id || !replyText.trim()}
                        onClick={() => sendReply(r._id)}
                        className="min-h-11 px-3 bg-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                      >
                        Publier
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyFor(null)}
                        className="min-h-11 px-3 text-sm text-gray-600"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm">
            <span className="text-gray-500">{pagination.total} avis</span>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                disabled={filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                className="px-3 py-1.5 rounded-lg border disabled:opacity-40"
              >
                Précédent
              </button>
              <span>
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={filters.page >= pagination.totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                className="px-3 py-1.5 rounded-lg border disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default AdminReviewsPage;
