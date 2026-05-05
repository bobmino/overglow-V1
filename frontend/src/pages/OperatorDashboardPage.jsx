import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';
import { Package, Calendar, DollarSign, Users, TrendingUp, MessageSquare } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';
import { useToast } from '../context/ToastContext';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
    <p className="text-gray-600 text-sm mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
  </div>
);

const OperatorDashboardPage = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeSchedules: 0,
    pendingBalance: 0,
    availableBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch operator products
        const { data: products } = await api.get('/api/products/my-products');
        
        // Fetch operator bookings
        const { data: bookings } = await api.get('/api/operator/bookings');
        
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const now = new Date();
        const paidBookings = bookings.filter((b) => (b.paymentStatus || '').toLowerCase() === 'paid');
        const pendingBalance = paidBookings
          .filter((b) => b.payoutDate && new Date(b.payoutDate) > now)
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const availableBalance = paidBookings
          .filter((b) => b.payoutDate && new Date(b.payoutDate) <= now)
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        
        setStats({
          totalProducts: products.length,
          totalBookings: bookings.length,
          totalRevenue,
          activeSchedules: products.reduce((sum, p) => sum + (p.schedules?.length || 0), 0),
          pendingBalance,
          availableBalance,
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        toast('Nous mettons a jour vos donnees financieres. Merci de reessayer.', { type: 'error' });
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
        <h1 className="text-3xl font-bold text-gray-900">Operator Dashboard</h1>
        <DashboardNavBar />
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          to="/operator/products/new"
          className="bg-green-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-800 transition"
        >
          Create Product
        </Link>
        <Link
          to="/operator/analytics"
          className="bg-white border border-gray-300 px-4 py-2 rounded-lg font-semibold text-gray-700 hover:border-green-700 transition"
        >
          View Analytics
        </Link>
        <Link
          to="/operator/bookings"
          className="bg-white border border-gray-300 px-4 py-2 rounded-lg font-semibold text-gray-700 hover:border-green-700 transition"
        >
          View Bookings
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Package}
          label="Total Products"
          value={stats.totalProducts}
          color="bg-blue-600"
        />
        <StatCard
          icon={Calendar}
          label="Active Schedules"
          value={stats.activeSchedules}
          color="bg-purple-600"
        />
        <StatCard
          icon={Users}
          label="Total Bookings"
          value={stats.totalBookings}
          color="bg-green-600"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`€${stats.totalRevenue.toFixed(2)}`}
          color="bg-yellow-600"
        />
      </div>

      {/* Finance Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Portefeuille</h2>
          <Link
            to="/operator/withdrawals"
            className="text-green-700 font-semibold hover:text-green-800 transition"
          >
            Gerer les versements
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800 font-semibold">Solde en attente</p>
            <p className="text-2xl font-bold text-amber-900">€{stats.pendingBalance.toFixed(2)}</p>
            <p className="text-xs text-amber-700 mt-1">Paiements encaisses, versement programme</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-800 font-semibold">Solde disponible</p>
            <p className="text-2xl font-bold text-green-900">€{stats.availableBalance.toFixed(2)}</p>
            <p className="text-xs text-green-700 mt-1">Versements eligibles (payoutDate atteinte)</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          to="/operator/products"
          className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-green-700 hover:shadow-lg transition"
        >
          <Package size={32} className="text-green-700 mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Products</h3>
          <p className="text-gray-600">View, edit, and manage your tour products</p>
        </Link>

        <Link
          to="/operator/bookings"
          className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-green-700 hover:shadow-lg transition"
        >
          <Calendar size={32} className="text-green-700 mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">View Bookings</h3>
          <p className="text-gray-600">See all bookings for your products</p>
        </Link>

        <Link
          to="/operator/analytics"
          className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-green-700 hover:shadow-lg transition"
        >
          <TrendingUp size={32} className="text-green-700 mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics & Insights</h3>
          <p className="text-gray-600">Monitor revenue trends and product performance</p>
        </Link>

        <Link
          to="/operator/inquiries"
          className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-green-700 hover:shadow-lg transition"
        >
          <MessageSquare size={32} className="text-green-700 mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Inquiries</h3>
          <p className="text-gray-600">Manage customer questions and validations</p>
        </Link>
        <Link
          to="/operator/withdrawals"
          className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-green-700 hover:shadow-lg transition"
        >
          <DollarSign size={32} className="text-green-700 mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Withdrawals</h3>
          <p className="text-gray-600">Request payouts and view withdrawal history</p>
        </Link>
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default OperatorDashboardPage;
