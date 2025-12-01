import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';
import { Users, Building2, Package, Calendar, DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
  <div 
    className={`bg-white rounded-xl border border-gray-200 p-6 ${onClick ? 'cursor-pointer hover:border-primary-600 hover:shadow-lg transition' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
    <p className="text-gray-600 text-sm mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
  </div>
);

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOperators: 0,
    totalProducts: 0,
    totalBookings: 0,
    pendingProducts: 0,
    publishedProducts: 0,
    totalRevenue: 0,
    operatorsByStatus: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/api/admin/stats');
        setStats(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <DashboardNavBar />
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          to="/admin/operators"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          Gérer les Opérateurs
        </Link>
        <Link
          to="/admin/products"
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition"
        >
          Valider les Produits
        </Link>
        <Link
          to="/admin/users"
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition"
        >
          Gérer les Utilisateurs
        </Link>
        <Link
          to="/admin/settings"
          className="bg-gray-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700 transition"
        >
          Paramètres
        </Link>
        <Link
          to="/admin/withdrawals"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition"
        >
          Retraits
        </Link>
        <Link
          to="/admin/approval-requests"
          className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700 transition"
        >
          Demandes d'approbation
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/admin/users">
          <StatCard
            icon={Users}
            label="Total Utilisateurs"
            value={stats.totalUsers}
            color="bg-blue-600"
          />
        </Link>
        <Link to="/admin/operators">
          <StatCard
            icon={Building2}
            label="Total Opérateurs"
            value={stats.totalOperators}
            color="bg-green-600"
          />
        </Link>
        <Link to="/admin/products">
          <StatCard
            icon={Package}
            label="Total Produits"
            value={stats.totalProducts}
            color="bg-purple-600"
          />
        </Link>
        <StatCard
          icon={Calendar}
          label="Total Réservations"
          value={stats.totalBookings}
          color="bg-orange-600"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/admin/products?status=Pending Review">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-yellow-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-yellow-600">
                <Clock size={24} className="text-white" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Produits en attente</p>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingProducts}</p>
          </div>
        </Link>
        <Link to="/admin/products?status=Published">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-600">
                <CheckCircle size={24} className="text-white" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Produits publiés</p>
            <p className="text-3xl font-bold text-gray-900">{stats.publishedProducts}</p>
          </div>
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-emerald-600">
              <DollarSign size={24} className="text-white" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Revenus totaux</p>
          <p className="text-3xl font-bold text-gray-900">€{stats.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/operators"
          className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-600 hover:shadow-lg transition"
        >
          <Building2 size={32} className="text-blue-600 mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Gérer les Opérateurs</h3>
          <p className="text-gray-600">Approuver, suspendre ou gérer les opérateurs</p>
        </Link>

        <Link
          to="/admin/products"
          className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-green-600 hover:shadow-lg transition"
        >
          <Package size={32} className="text-green-600 mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Valider les Produits</h3>
          <p className="text-gray-600">Approuver ou rejeter les produits en attente</p>
        </Link>

        <Link
          to="/admin/users"
          className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-purple-600 hover:shadow-lg transition"
        >
          <Users size={32} className="text-purple-600 mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Gérer les Utilisateurs</h3>
          <p className="text-gray-600">Voir et gérer tous les utilisateurs</p>
        </Link>
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default AdminDashboardPage;

