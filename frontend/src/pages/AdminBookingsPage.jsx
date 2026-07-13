import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Eye,
  CheckCircle,
  XCircle,
  Download,
  CalendarDays,
  Search,
  RotateCcw,
  Banknote,
  Percent,
  Users,
} from 'lucide-react';
import api from '../config/axios';
import { useToast } from '../context/ToastContext';
import { logger } from '../utils/logger.js';
import ScrollToTopButton from '../components/ScrollToTopButton';
import AdminModal from '../components/AdminModal';
import AdminCollapsibleFilters from '../components/AdminCollapsibleFilters';

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'En attente' },
  { value: 'PENDING_PAYMENT', label: 'Paiement en attente' },
  { value: 'Confirmed', label: 'Confirmée' },
  { value: 'Cancelled', label: 'Annulée' },
];

const statusBadgeClass = (status) => {
  switch (status) {
    case 'Confirmed':
      return 'bg-green-100 text-green-800';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    case 'PENDING_PAYMENT':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const statusLabel = (status) =>
  STATUS_OPTIONS.find((s) => s.value === status)?.label || status;

const formatMAD = (amount) =>
  `${Number(amount || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const DetailModal = ({ booking, onClose }) => {
  if (!booking) return null;
  const product = booking.schedule?.product;
  return (
    <AdminModal
      open
      onClose={onClose}
      title={`Réservation #${String(booking._id).slice(-8).toUpperCase()}`}
    >
        <div className="space-y-6 text-sm">
          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Client</h3>
            <p>{booking.user?.name || '—'}</p>
            <p className="text-gray-600">{booking.user?.email || '—'}</p>
            <p className="text-gray-600">{booking.user?.phone || ''}</p>
          </section>
          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Produit</h3>
            <p>{product?.title || '—'}</p>
            <p className="text-gray-600">{product?.city || ''}</p>
            <p className="text-gray-600">
              Créneau : {formatDate(booking.schedule?.date)} {booking.schedule?.time || ''}
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Opérateur</h3>
            <p>{booking.operator?.companyName || booking.operator?.publicName || '—'}</p>
          </section>
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Montant</h3>
              <p>{formatMAD(booking.totalAmount)}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Tickets</h3>
              <p>{booking.numberOfTickets}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Statut</h3>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(booking.status)}`}>
                {statusLabel(booking.status)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Paiement</h3>
              <p>{booking.paymentMethod || '—'} / {booking.paymentStatus || '—'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Référence</h3>
              <p className="font-mono text-xs">{booking.paymentReference || booking.paymentIntentId || '—'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Créée le</h3>
              <p>{formatDate(booking.createdAt)}</p>
            </div>
          </section>
          {booking.internalNote && (
            <section>
              <h3 className="font-semibold text-gray-900 mb-1">Note interne</h3>
              <p className="text-gray-600">{booking.internalNote}</p>
            </section>
          )}
        </div>
    </AdminModal>
  );
};

const AdminBookingsPage = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, revenue: 0, cancellationRate: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statuses, setStatuses] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const queryParams = useMemo(() => {
    const params = { page, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' };
    if (search) params.search = search;
    if (statuses.length) params.status = statuses.join(',');
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    return params;
  }, [page, search, statuses, dateFrom, dateTo]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/bookings', { params: queryParams });
      setBookings(data.bookings || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      logger.error('Admin bookings fetch failed', err);
      toast(err.response?.data?.message || 'Impossible de charger les réservations', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [queryParams, toast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const toggleStatus = (value) => {
    setPage(1);
    setStatuses((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const resetFilters = () => {
    setSearch('');
    setSearchInput('');
    setStatuses([]);
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const confirmPayment = async (id) => {
    setActionLoading(id);
    try {
      await api.put(`/api/admin/bookings/${id}/confirm-payment`);
      toast('Paiement validé', { type: 'success' });
      fetchBookings();
    } catch (err) {
      toast(err.response?.data?.message || 'Échec de la validation', { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const cancelBooking = async (id) => {
    if (!window.confirm('Confirmer l’annulation de cette réservation ?')) return;
    setActionLoading(id);
    try {
      await api.put(`/api/admin/bookings/${id}/cancel`, { reason: 'Annulée par l’administrateur' });
      toast('Réservation annulée', { type: 'success' });
      fetchBookings();
    } catch (err) {
      toast(err.response?.data?.message || 'Échec de l’annulation', { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const exportCsv = () => {
    const headers = ['ID', 'Client', 'Email', 'Produit', 'Opérateur', 'Montant', 'Statut', 'Date'];
    const rows = bookings.map((b) => [
      String(b._id).slice(-8),
      b.user?.name || '',
      b.user?.email || '',
      b.schedule?.product?.title || '',
      b.operator?.companyName || b.operator?.publicName || '',
      b.totalAmount ?? '',
      b.status,
      b.createdAt ? new Date(b.createdAt).toISOString() : '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservations-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pageNumbers = useMemo(() => {
    const max = Math.min(totalPages, 7);
    const start = Math.max(1, Math.min(page - 3, totalPages - max + 1));
    return Array.from({ length: Math.max(0, max) }, (_, i) => start + i).filter((n) => n >= 1 && n <= totalPages);
  }, [page, totalPages]);

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="hidden md:block text-3xl font-heading font-bold text-gray-900">Réservations</h1>
          <p className="text-gray-600 mt-1">Gestion et suivi des réservations plateforme</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!bookings.length}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 font-semibold hover:border-primary-600 hover:text-primary-700 disabled:opacity-50"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><Users size={16} /> Total</div>
          <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><CalendarDays size={16} /> Ce mois</div>
          <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><Banknote size={16} /> Revenu</div>
          <p className="text-xl md:text-2xl font-bold text-gray-900 break-words">{formatMAD(stats.revenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><Percent size={16} /> Annulation</div>
          <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.cancellationRate}%</p>
        </div>
      </div>

      {/* Filters */}
      <AdminCollapsibleFilters>
        <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  setSearch(searchInput.trim());
                }
              }}
              placeholder="Rechercher client (nom ou email)"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setPage(1); setDateFrom(e.target.value); }}
            className="px-3 py-2 border border-gray-300 rounded-lg"
            aria-label="Date de début"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setPage(1); setDateTo(e.target.value); }}
            className="px-3 py-2 border border-gray-300 rounded-lg"
            aria-label="Date de fin"
          />
          <button
            type="button"
            onClick={() => { setPage(1); setSearch(searchInput.trim()); }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
          >
            Filtrer
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw size={16} />
            Réinitialiser
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleStatus(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                statuses.includes(opt.value)
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        </div>
      </AdminCollapsibleFilters>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarDays size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-semibold text-gray-800">Aucune réservation trouvée</p>
            <p className="text-gray-500 mt-1">Modifiez les filtres ou réessayez plus tard.</p>
          </div>
        ) : (
          <>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr className="text-left text-gray-600 border-b border-gray-200">
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Utilisateur</th>
                  <th className="px-4 py-3 font-semibold">Produit</th>
                  <th className="px-4 py-3 font-semibold">Opérateur</th>
                  <th className="px-4 py-3 font-semibold">Montant</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, idx) => (
                  <tr
                    key={b._id}
                    className={`border-b border-gray-100 hover:bg-primary-50/40 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{String(b._id).slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{b.user?.name || '—'}</div>
                      <div className="text-gray-500 text-xs">{b.user?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[180px] truncate">{b.schedule?.product?.title || '—'}</td>
                    <td className="px-4 py-3">{b.operator?.companyName || b.operator?.publicName || '—'}</td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatMAD(b.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(b.status)}`}>
                        {statusLabel(b.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatDate(b.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelected(b)}
                          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                          title="Détails"
                        >
                          <Eye size={16} />
                        </button>
                        {b.status === 'PENDING_PAYMENT' && (
                          <button
                            type="button"
                            disabled={actionLoading === b._id}
                            onClick={() => confirmPayment(b._id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                            title="Valider paiement"
                          >
                            <CheckCircle size={14} />
                            Valider
                          </button>
                        )}
                        {b.status === 'Confirmed' && (
                          <button
                            type="button"
                            disabled={actionLoading === b._id}
                            onClick={() => cancelBooking(b._id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                            title="Annuler"
                          >
                            <XCircle size={14} />
                            Annuler
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden divide-y divide-gray-200">
            {bookings.map((b) => (
              <article key={b._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-gray-500">
                      #{String(b._id).slice(-8).toUpperCase()}
                    </p>
                    <p className="font-semibold text-gray-900">{b.user?.name || '—'}</p>
                    <p className="text-xs text-gray-500 break-all">{b.user?.email || ''}</p>
                  </div>
                  <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(b.status)}`}>
                    {statusLabel(b.status)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Produit</p>
                    <p className="font-medium text-gray-800">{b.schedule?.product?.title || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Montant</p>
                    <p className="font-semibold break-words">{formatMAD(b.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-gray-700">{formatDate(b.createdAt)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(b)}
                    className="min-h-11 inline-flex items-center justify-center gap-2 px-3 rounded-lg border border-gray-300 text-gray-700 font-semibold"
                  >
                    <Eye size={16} /> Détails
                  </button>
                  {b.status === 'PENDING_PAYMENT' && (
                    <button
                      type="button"
                      disabled={actionLoading === b._id}
                      onClick={() => confirmPayment(b._id)}
                      className="min-h-11 inline-flex items-center justify-center gap-2 px-3 rounded-lg bg-green-600 text-white font-semibold disabled:opacity-50"
                    >
                      <CheckCircle size={16} /> Valider
                    </button>
                  )}
                  {b.status === 'Confirmed' && (
                    <button
                      type="button"
                      disabled={actionLoading === b._id}
                      onClick={() => cancelBooking(b._id)}
                      className="min-h-11 inline-flex items-center justify-center gap-2 px-3 rounded-lg bg-red-600 text-white font-semibold disabled:opacity-50"
                    >
                      <XCircle size={16} /> Annuler
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
          </>
        )}

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-slate-50">
            <p className="text-sm text-gray-600">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} sur {total} résultats
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-40 hover:bg-white"
              >
                Précédent
              </button>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`${n === page ? 'inline-flex' : 'hidden sm:inline-flex'} items-center justify-center min-w-[2rem] px-2 py-1.5 rounded-lg text-sm font-semibold ${
                    n === page ? 'bg-primary-600 text-white' : 'border border-gray-300 hover:bg-white'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-40 hover:bg-white"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && <DetailModal booking={selected} onClose={() => setSelected(null)} />}
      <ScrollToTopButton />
    </div>
  );
};

export default AdminBookingsPage;
