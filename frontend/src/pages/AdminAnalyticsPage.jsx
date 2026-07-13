import React from 'react';
import AdminAnalytics from '../components/AdminAnalytics';

/** [PROMPT-1] Dedicated analytics page — content already lived on the admin dashboard. */
const AdminAnalyticsPage = () => (
  <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
    <h1 className="text-3xl font-bold text-gray-900 font-heading mb-6">Statistiques</h1>
    <AdminAnalytics />
  </div>
);

export default AdminAnalyticsPage;
