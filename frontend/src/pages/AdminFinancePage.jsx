import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Banknote,
  Percent,
  Wallet,
  Clock,
  ArrowRight,
  Landmark,
  CreditCard,
  Settings,
} from 'lucide-react';
import api from '../config/axios';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { logger } from '../utils/logger.js';

const PERIODS = [
  { id: 'today', label: 'Aujourd’hui' },
  { id: '7d', label: '7j' },
  { id: '30d', label: '30j' },
  { id: '90d', label: '90j' },
  { id: 'thisMonth', label: 'Ce mois' },
];

const PIE_COLORS = ['#059669', '#2563eb', '#d97706', '#64748b', '#7c3aed'];

const formatMoney = (n, currency = 'MAD') =>
  `${Math.round(Number(n) || 0)
    .toLocaleString('fr-FR')
    .replace(/\u202f/g, ' ')} ${currency}`;

const statusLabel = (status) => {
  const map = {
    Confirmed: 'Confirmé',
    Pending: 'En attente',
    PENDING_PAYMENT: 'Paiement en attente',
    Cancelled: 'Annulé',
    Approved: 'Approuvé',
    Rejected: 'Refusé',
    Processed: 'Traité',
  };
  return map[status] || status || '—';
};

/**
 * [PROMPT-8] Admin finance command center.
 */
const AdminFinancePage = () => {
  const [period, setPeriod] = useState('30d');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loadingTx, setLoadingTx] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    paymentMethod: '',
    page: 1,
  });

  useEffect(() => {
    const load = async () => {
      setLoadingStats(true);
      try {
        const { data } = await api.get('/api/admin/finance/stats', { params: { period } });
        setStats(data);
      } catch (err) {
        logger.error('Finance stats failed', err);
      } finally {
        setLoadingStats(false);
      }
    };
    load();
  }, [period]);

  useEffect(() => {
    const load = async () => {
      setLoadingTx(true);
      try {
        const { data } = await api.get('/api/admin/finance/transactions', {
          params: {
            period,
            type: filters.type || undefined,
            status: filters.status || undefined,
            paymentMethod: filters.paymentMethod || undefined,
            page: filters.page,
            limit: 15,
          },
        });
        setTransactions(data.transactions || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      } catch (err) {
        logger.error('Finance transactions failed', err);
      } finally {
        setLoadingTx(false);
      }
    };
    load();
  }, [period, filters]);

  const kpis = useMemo(() => {
    if (!stats?.kpis) return null;
    const k = stats.kpis;
    return [
      {
        key: 'revenue',
        label: 'Revenu total',
        value: formatMoney(k.revenue),
        icon: Banknote,
        color: 'bg-emerald-600',
      },
      {
        key: 'commissions',
        label: `Commissions (${stats.commissionPercent ?? 15} %)`,
        value: formatMoney(k.commissions),
        icon: Percent,
        color: 'bg-violet-600',
      },
      {
        key: 'processed',
        label: 'Retraits traités',
        value: formatMoney(k.withdrawalsProcessedAmount),
        icon: Wallet,
        color: 'bg-blue-600',
      },
      {
        key: 'pending',
        label: 'Retraits en attente',
        value: `${k.withdrawalsPending?.count || 0} · ${formatMoney(k.withdrawalsPending?.amount)}`,
        icon: Clock,
        color: 'bg-amber-600',
      },
    ];
  }, [stats]);

  if (loadingStats && !stats) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded-xl w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading flex items-center gap-2">
            <Landmark className="text-primary-600" size={28} />
            Finances
          </h1>
          <p className="text-gray-600 mt-1">Vue d’ensemble revenus, commissions et retraits</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPeriod(p.id);
                setFilters((f) => ({ ...f, page: 1 }));
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${
                period === p.id
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1 — KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis?.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.key} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className={`inline-flex p-2.5 rounded-lg ${k.color} mb-3`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className="text-sm text-gray-500 mb-1">{k.label}</p>
              <p className="text-xl font-bold text-gray-900 font-heading">{k.value}</p>
            </div>
          );
        })}
      </div>

      {/* Row 2 — Charts */}
      <div className="hidden sm:grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
            Revenus ({stats?.chartGranularity === 'weekly' ? 'hebdomadaire' : 'quotidien'})
          </h2>
          <div className="h-64">
            {(stats?.revenueChart || []).length === 0 ? (
              <p className="text-sm text-gray-500 py-16 text-center">Aucune donnée sur cette période</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => formatMoney(v)}
                    labelFormatter={(l) => `Date : ${l}`}
                  />
                  <Bar dataKey="revenue" fill="#059669" name="Revenu" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
            Répartition par moyen de paiement
          </h2>
          <div className="h-64">
            {(stats?.paymentMethodBreakdown || []).length === 0 ? (
              <p className="text-sm text-gray-500 py-16 text-center">Aucune donnée sur cette période</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.paymentMethodBreakdown}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.paymentMethodBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      <p className="sm:hidden mb-6 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
        Graphiques disponibles sur tablette et plus
      </p>

      {/* Row 3 — Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Transactions récentes
          </h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 1 }))}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="">Tous les types</option>
              <option value="booking">Réservation</option>
              <option value="withdrawal">Retrait</option>
              <option value="refund">Remboursement</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="">Tous les statuts</option>
              <option value="Confirmed">Confirmé</option>
              <option value="PENDING_PAYMENT">Paiement en attente</option>
              <option value="Pending">En attente</option>
              <option value="Approved">Approuvé</option>
              <option value="Processed">Traité</option>
              <option value="Rejected">Refusé</option>
            </select>
            <select
              value={filters.paymentMethod}
              onChange={(e) =>
                setFilters((f) => ({ ...f, paymentMethod: e.target.value, page: 1 }))
              }
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="">Tous les moyens</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="cmi">CMI</option>
              <option value="bank">Bank</option>
            </select>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-3 font-semibold">Type</th>
                <th className="py-2 pr-3 font-semibold">Montant</th>
                <th className="py-2 pr-3 font-semibold">Méthode</th>
                <th className="py-2 pr-3 font-semibold">Statut</th>
                <th className="py-2 pr-3 font-semibold">Date</th>
                <th className="py-2 font-semibold">Opérateur</th>
              </tr>
            </thead>
            <tbody>
              {loadingTx ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Chargement…
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Aucune transaction
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={`${tx.type}-${tx.id}`} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2.5 pr-3 font-medium text-gray-900">{tx.typeLabel}</td>
                    <td className="py-2.5 pr-3">{formatMoney(tx.amount, tx.currency)}</td>
                    <td className="py-2.5 pr-3">{tx.paymentMethodLabel || '—'}</td>
                    <td className="py-2.5 pr-3">{statusLabel(tx.status)}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      {tx.date
                        ? new Date(tx.date).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="py-2.5">{tx.operator}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="md:hidden divide-y divide-slate-100">
          {loadingTx ? (
            <div className="py-8 text-center text-gray-500">Chargement…</div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Aucune transaction</div>
          ) : (
            transactions.map((tx) => (
              <article key={`${tx.type}-${tx.id}`} className="py-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{tx.typeLabel}</p>
                    <p className="text-xs text-gray-500">{tx.paymentMethodLabel || '—'}</p>
                  </div>
                  <p className="font-bold text-gray-900 text-right break-words">
                    {formatMoney(tx.amount, tx.currency)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Statut</p>
                    <p className="text-gray-800">{statusLabel(tx.status)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-gray-800">
                      {tx.date
                        ? new Date(tx.date).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Opérateur</p>
                    <p className="text-gray-800">{tx.operator || '—'}</p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-gray-500">
              {pagination.total} transaction{pagination.total > 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40"
              >
                Précédent
              </button>
              <span className="px-2 py-1.5 text-gray-600">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={filters.page >= pagination.totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Row 4 — Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <Link
          to="/admin/withdrawals"
          className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-primary-400 hover:shadow-sm transition"
        >
          <span className="inline-flex items-center gap-2 font-semibold text-gray-800">
            <Wallet size={18} className="text-emerald-600" />
            Gérer les retraits
          </span>
          <ArrowRight size={16} className="text-gray-400" />
        </Link>
        <Link
          to="/admin/pending-payments"
          className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-primary-400 hover:shadow-sm transition"
        >
          <span className="inline-flex items-center gap-2 font-semibold text-gray-800">
            <CreditCard size={18} className="text-amber-600" />
            Paiements en attente
          </span>
          <ArrowRight size={16} className="text-gray-400" />
        </Link>
        <Link
          to="/admin/settings?tab=finance"
          className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-primary-400 hover:shadow-sm transition"
        >
          <span className="inline-flex items-center gap-2 font-semibold text-gray-800">
            <Settings size={18} className="text-slate-600" />
            Paramètres de commission
          </span>
          <ArrowRight size={16} className="text-gray-400" />
        </Link>
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default AdminFinancePage;
