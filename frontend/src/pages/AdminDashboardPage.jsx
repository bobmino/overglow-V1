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

const formatMoney = (n) =>
  `${Math.round(Number(n) || 0)
    .toLocaleString('fr-FR')
    .replace(/\u202f/g, ' ')} €`;

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

const KpiCard = ({ icon, label, value, trend, color }) => {
  const Icon = icon;
  return (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <TrendBadge value={trend} />
    </div>
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900 font-heading">{value}</p>
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
        color: 'bg-primary-600',
      },
      {
        key: 'bookings',
        label: 'Réservations',
        value: formatNum(current.bookings),
        trend: trendPct(current.bookings, previous.bookings),
        icon: CalendarDays,
        color: 'bg-orange-600',
      },
      {
        key: 'users',
        label: 'Nouveaux utilisateurs',
        value: formatNum(current.users),
        trend: trendPct(current.users, previous.users),
        icon: Users,
        color: 'bg-blue-600',
      },
      {
        key: 'conversion',
        label: 'Taux de conversion',
        value: `${current.conversion ?? 0} %`,
        trend: trendPct(current.conversion, previous.conversion),
        icon: Percent,
        color: 'bg-violet-600',
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
      color: 'bg-orange-50 text-orange-800 border-orange-200',
    },
    {
      count: pending.products || 0,
      label: 'produits en attente',
      to: '/admin/products?status=Pending%20Review',
      icon: Package,
      color: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    },
    {
      count: pending.payments || 0,
      label: 'paiements',
      to: '/admin/pending-payments',
      icon: CreditCard,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      count: pending.approvals || 0,
      label: 'demandes d’approbation',
      to: '/admin/approval-requests',
      icon: Building2,
      color: 'bg-blue-50 text-blue-800 border-blue-200',
    },
  ].filter((p) => p.count > 0);

  if (loading && !data) {
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
    <div className="container mx-auto py-2 md:py-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading">Tableau de bord</h1>
          <p className="text-gray-600 mt-1">Centre de commande plateforme</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
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
        {kpis?.map((k) => (
          <KpiCard
            key={k.key}
            icon={k.icon}
            label={k.label}
            value={k.value}
            trend={k.trend}
            color={k.color}
          />
        ))}
      </div>

      {/* Row 2 — Pending actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          Actions en attente
        </h2>
        {pendingPills.length === 0 ? (
          <p className="text-sm text-gray-500">Rien en attente — belle journée.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pendingPills.map((p) => {
              const Icon = p.icon;
              return (
                <Link
                  key={p.to + p.label}
                  to={p.to}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-semibold hover:shadow-sm transition ${p.color}`}
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

      {/* Row 3 — Chart + Top products */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-heading font-bold text-gray-900 mb-4">Revenus</h2>
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
                  strokeWidth={2}
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
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Aucune donnée de revenus pour cette période.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-heading font-bold text-gray-900 mb-4">Top 5 produits</h2>
          {!data?.topProducts?.length ? (
            <p className="text-sm text-gray-500">Aucune vente sur cette période.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-semibold">Produit</th>
                    <th className="pb-2 font-semibold">Rés.</th>
                    <th className="pb-2 font-semibold">Revenu</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p) => (
                    <tr key={String(p.id)} className="border-b border-gray-50">
                      <td className="py-2.5 pr-2 max-w-[140px] truncate font-medium text-gray-900">
                        {p.name}
                      </td>
                      <td className="py-2.5">{formatNum(p.bookings)}</td>
                      <td className="py-2.5 whitespace-nowrap">{formatMoney(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Row 4 — Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-bold text-gray-900">Activité récente</h2>
          <Link
            to="/admin/bookings"
            className="text-sm font-semibold text-primary-700 inline-flex items-center gap-1 hover:text-primary-800"
          >
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>
        <ul className="space-y-3">
          {(data?.recentActivity || []).slice(0, 8).map((item, idx) => {
            const Icon = activityIcon(item.type);
            return (
              <li key={`${item.type}-${idx}-${item.timestamp}`}>
                <Link
                  to={item.link || '/admin/dashboard'}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition"
                >
                  <span className="mt-0.5 w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-gray-900">{item.description}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      {relativeTimeFr(item.timestamp)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
          {!data?.recentActivity?.length && (
            <li className="text-sm text-gray-500">Aucune activité récente.</li>
          )}
        </ul>
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default AdminDashboardPage;
