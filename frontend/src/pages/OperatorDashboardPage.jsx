import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../config/axios';
import { Package, Calendar, DollarSign, Users, TrendingUp, MessageSquare } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className="bg-white rounded-xl border border-gray-200 p-6"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
    <p className="text-gray-600 text-sm mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
  </motion.div>
);

const OperatorDashboardPage = () => {
  const { toast } = useToast();

  const [stats, setStats] = useState({
    totalSales: 0,
    confirmedBookings: 0,
    topExperiences: [],
  });

  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/api/operator/dashboard-stats');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        toast('Nous mettons à jour vos données financières. Merci de reessayer.', { type: 'error' });
      }
    };

    const fetchBookings = async () => {
      try {
        const { data } = await api.get('/api/operator/bookings');
        setBookings(data);
        setFilteredBookings(data);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        toast('Nous mettons à jour vos réservations. Merci de reessayer.', { type: 'error' });
      }
    };

    fetchStats();
    fetchBookings();
  }, [toast]);

  const handleFilterChange = (event) => {
    const query = event.target.value.toLowerCase();
    const filtered = bookings.filter((booking) =>
      booking.customerEmail.toLowerCase().includes(query)
    );
    setFilteredBookings(filtered);
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Package}
          label="Total Sales"
          value={`€${stats.totalSales.toFixed(2)}`}
          color="bg-blue-600"
        />
        <StatCard
          icon={Calendar}
          label="Confirmed Bookings"
          value={stats.confirmedBookings}
          color="bg-purple-600"
        />
        <StatCard
          icon={Users}
          label="Top Experiences"
          value={stats.topExperiences.length}
          color="bg-green-600"
        />
      </div>

      {/* Bookings Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Bookings</h2>
          <input
            type="text"
            placeholder="Search by customer email..."
            onChange={handleFilterChange}
            className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none"
          />
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left">Customer Email</th>
              <th className="px-6 py-3 text-left">Booking Date</th>
              <th className="px-6 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((booking) => (
              <tr key={booking.id} className="border-b border-gray-200">
                <td className="px-6 py-4">{booking.customerEmail}</td>
                <td className="px-6 py-4">{new Date(booking.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">{booking.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
