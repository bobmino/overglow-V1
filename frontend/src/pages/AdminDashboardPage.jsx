import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Banknote,
  CalendarDays,
  Users,
  Percent,
  TrendingUp,
  TrendingDown,
  Building2,
  Package,
  CreditCard,
  Handshake,
  ArrowRight,
  UserPlus,
  CalendarPlus,
  Wallet,
  Sparkles,
} from 'lucide-react';
import api from '../config/axios';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { logger } from '../utils/logger.js';
import { formatMoneyMad } from '../utils/formatMoneyMad.js';

const PERIODS = [
  { id: 'today', label: 'Aujourd’hui' },
  { id: '7d', label: '7j' },
  { id: '30d', label: '30j' },
  { id: '90d', label: '90j' },
  { id: 'thisMonth', label: 'Ce mois' },
];

const formatMoney = (n) => formatMoneyMad(n);

const formatNum = (n) =>
  Math.round(Number(n) || 0)
    .toLocaleString('fr-FR')
    .replace(/\u202f/g, ' ');

const trendPct = (current, previous) => {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
};

const relativeTimeFr = (dateStr) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'à l’instant';
  if (mins < 60) return `il y a ${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'hier';
  return `il y a ${d} j`;
};

const TrendBadge = ({ value }) => {
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${
        up ? 'text-primary-600' : 'text-red-600'
      }`}
    >
      <Icon size={14} />
      {up ? '+' : ''}
      {value}%
    </span>
  );
};

const KpiCard = ({ icon, label, value, trend, tone }) => {
  const Icon = icon;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md hover:border-primary-200 transition">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-600 to-secondary-500 opacity-80" />
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${tone}`}>
          <Icon size={20} className="text-white" />
        </div>
        <TrendBadge value={trend} />
      </div>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900 font-heading tracking-tight">{value}</p>
    </div>
  );
};

const activityIcon = (type) => {
  switch (type) {
    case 'booking':
      return CalendarPlus;
    case 'user':
      return UserPlus;
    case 'operator':
      return Building2;
    case 'withdrawal':
      return Wallet;
    default:
      return CalendarDays;
  }
};

const AdminDashboardPage = () => {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data: res } = await api.get('/api/admin/stats', { params: { period } });
        setData(res);
      } catch (error) {
        logger.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [period]);

  const kpis = useMemo(() => {
    if (!data?.current) return null;
    const { current, previous } = data;
    return [
      {
        key: 'revenue',
        label: 'Revenus',
        value: formatMoney(current.revenue),
        trend: trendPct(current.revenue, previous.revenue),
        icon: Banknote,
        tone: 'bg-primary-600',
      },
      {
        key: 'bookings',
        label: 'Réservations',
        value: formatNum(current.bookings),
        trend: trendPct(current.bookings, previous.bookings),
        icon: CalendarDays,
        tone: 'bg-secondary-600',
      },
      {
        key: 'users',
        label: 'Nouveaux utilisateurs',
        value: formatNum(current.users),
        trend: trendPct(current.users, previous.users),
        icon: Users,
        tone: 'bg-primary-800',
      },
      {
        key: 'conversion',
        label: 'Taux de conversion',
        value: `${current.conversion ?? 0} %`,
        trend: trendPct(current.conversion, previous.conversion),
        icon: Percent,
        tone: 'bg-slate-700',
      },
    ];
  }, [data]);

  const pending = data?.pendingActions || {};
  const pendingPills = [
    {
      count: pending.operators || 0,
      label: 'opérateurs à approuver',
      to: '/admin/approval-requests',
      icon: Handshake,
      color: 'bg-amber-50 text-amber-900 border-amber-200',
    },
    {
      count: pending.products || 0,
      label: 'produits en attente',
      to: '/admin/products?status=Pending%20Review',
      icon: Package,
      color: 'bg-primary-50 text-primary-800 border-primary-200',
    },
    {
      count: pending.payments || 0,
      label: 'paiements',
      to: '/admin/pending-payments',
      icon: CreditCard,
      color: 'bg-secondary-500/10 text-amber-900 border-amber-200',
    },
    {
      count: pending.approvals || 0,
      label: 'demandes d’approbation',
      to: '/admin/approval-requests',
      icon: Building2,
      color: 'bg-slate-50 text-slate-800 border-slate-200',
    },
  ].filter((p) => p.count > 0);

  if (loading && !data) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-36 bg-primary-100/60 rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200/80 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200/80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white px-6 py-8 md:px-10 md:py-10 shadow-lg">
        <div className="absolute -end-16 -top-16 w-56 h-56 rounded-full bg-secondary-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -start-10 -bottom-20 w-64 h-64 rounded-full bg-primary-500/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-primary-200/90 mb-2 flex items-center gap-2">
              <Sparkles size={14} className="text-secondary-500" />
              Overglow Cockpit
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight">
              Centre de commande
            </h1>
            <p className="text-primary-100/90 text-sm mt-2 max-w-xl">
              Pilotage live : revenus, file d’attente et activité — même langage visuel que le store.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`px-3.5 py-2 rounded-full text-sm font-semibold border transition ${
                  period === p.id
                    ? 'bg-white text-primary-900 border-white shadow-sm'
                    : 'bg-white/10 text-white border-white/25 hover:bg-white/20'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis?.map((k) => (
          <KpiCard
            key={k.key}
            icon={k.icon}
            label={k.label}
            value={k.value}
            trend={k.trend}
            tone={k.tone}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-500 mb-3">
          Actions en attente
        </h2>
        {pendingPills.length === 0 ? (
          <p className="text-sm text-slate-500">Rien en attente — belle journée.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pendingPills.map((p) => {
              const Icon = p.icon;
              return (
                <Link
                  key={p.to + p.label}
                  to={p.to}
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold hover:shadow-sm transition ${p.color}`}
                >
                  <Icon size={16} />
                  <span>
                    {p.count} {p.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-heading font-bold text-slate-900 mb-4">Revenus (MAD)</h2>
          <div className="h-72 min-h-[18rem] w-full min-w-0">
            {Array.isArray(data?.revenueChart) && data.revenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <LineChart data={data.revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => formatMoney(v)}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="current"
                    name="Période actuelle"
                    stroke="#059669"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="previous"
                    name="Période précédente"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                Aucune donnée de revenus pour cette période.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-heading font-bold text-slate-900 mb-4">Top 5 produits</h2>
          {!data?.topProducts?.length ? (
            <p className="text-sm text-slate-500">Aucune vente sur cette période.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="pb-2 font-semibold">Produit</th>
                    <th className="pb-2 font-semibold">Rés.</th>
                    <th className="pb-2 font-semibold">Revenu</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p) => (
                    <tr key={String(p.id)} className="border-b border-slate-50">
                      <td className="py-2.5 pr-2 max-w-[140px] truncate font-medium text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-2.5 text-slate-700">{formatNum(p.bookings)}</td>
                      <td className="py-2.5 whitespace-nowrap font-semibold text-primary-700">
                        {formatMoney(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-bold text-slate-900">Activité récente</h2>
          <Link
            to="/admin/bookings"
            className="text-sm font-semibold text-primary-700 inline-flex items-center gap-1 hover:text-primary-800"
          >
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>
        <ul className="space-y-2">
          {(data?.recentActivity || []).slice(0, 8).map((item, idx) => {
            const Icon = activityIcon(item.type);
            return (
              <li key={`${item.type}-${idx}-${item.timestamp}`}>
                <Link
                  to={item.link || '/admin/dashboard'}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-primary-50/60 transition"
                >
                  <span className="mt-0.5 w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-slate-900">{item.description}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">
                      {relativeTimeFr(item.timestamp)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
          {!data?.recentActivity?.length && (
            <li className="text-sm text-slate-500">Aucune activité récente.</li>
          )}
        </ul>
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default AdminDashboardPage;
