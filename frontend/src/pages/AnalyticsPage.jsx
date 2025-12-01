import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Users, TrendingUp, Package } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/api/operator/analytics');
        setData(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load analytics data');
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  const totalRevenue = data?.totalRevenue ?? 0;
  const totalBookings = data?.totalBookings ?? 0;
  const avgRevenue = data?.avgRevenuePerBooking ?? 0;
  const activeProducts = data?.activeProducts ?? 0;
  const revenueData = data?.revenueData ?? [];
  const productData = data?.productData ?? [];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <DashboardNavBar />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`€${totalRevenue.toFixed(2)}`}
          color="bg-green-600"
        />
        <StatCard
          icon={Users}
          label="Total Bookings"
          value={totalBookings}
          color="bg-blue-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg. Revenue/Booking"
          value={`€${avgRevenue.toFixed(2)}`}
          color="bg-purple-600"
        />
        <StatCard
          icon={Package}
          label="Active Products"
          value={activeProducts}
          color="bg-orange-600"
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-wrap gap-3 mb-10">
        <Link
          to="/operator/dashboard"
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 transition"
        >
          Back to Dashboard
        </Link>
        <Link
          to="/operator/products"
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
        >
          Manage Products
        </Link>
        <Link
          to="/operator/bookings"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          View Bookings
        </Link>
        <a
          href="#monthly-revenue"
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-semibold hover:border-green-600 transition"
        >
          Jump to Revenue
        </a>
        <a
          href="#bookings-by-product"
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-semibold hover:border-green-600 transition"
        >
          Jump to Products
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div id="monthly-revenue" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Revenue</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#15803d" name="Revenue (€)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Performance */}
        <div id="bookings-by-product" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Bookings by Product</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.productData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="bookings"
                >
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <ScrollToTopButton />
    </div>
  );
};

export default AnalyticsPage;
