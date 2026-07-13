import React, { useState, useEffect } from 'react';
import { logger } from '../utils/logger.js';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import api from '../config/axios';

const COLORS = ['#059669', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#6366F1'];

const AdminAnalytics = () => {
  const [data, setData] = useState({
    revenueByMonth: [],
    salesByCity: [],
    kpis: {
      totalRevenue: 0,
      totalBookings: 0,
      averageCart: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/api/admin/analytics');
        setData(response.data);
        setLoading(false);
      } catch (err) {
        logger.error('Failed to load analytics', err);
        setError('Impossible de charger les données analytiques');
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-200 rounded-xl"></div>
          <div className="h-96 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">{error}</div>;
  }

  const { kpis, revenueByMonth, salesByCity } = data;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
          <p className="font-bold text-slate-800">{label || payload[0].name}</p>
          <p className="text-primary-600 font-semibold">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* KPIs Minimalistes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Revenu Total</p>
            <p className="text-3xl font-bold text-slate-900">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(kpis.totalRevenue)}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Total Réservations</p>
            <p className="text-3xl font-bold text-slate-900">{kpis.totalBookings}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <ShoppingCart size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Panier Moyen</p>
            <p className="text-3xl font-bold text-slate-900">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(kpis.averageCart)}
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* BarChart: Revenus par mois */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 font-heading">Revenus mensuels (12 derniers mois)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMonth} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748B', fontSize: 12}}
                  tickFormatter={(value) => `${value}€`}
                />
                <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#F1F5F9'}} />
                <Bar dataKey="revenue" fill="#059669" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PieChart: Répartition par ville */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 font-heading">Répartition des ventes par destination</h3>
          <div className="h-80">
            {salesByCity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByCity}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {salesByCity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                Aucune donnée de vente par ville disponible.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminAnalytics;
