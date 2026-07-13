import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { Settings, Save, Award } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';
import { logger } from '../utils/logger.js';

const AdminSettingsPage = () => {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState({
    autoApproveProducts: false,
    autoApproveReviews: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/api/settings');
      setSettings(data);
      setLoading(false);
    } catch (error) {
      logger.error('Failed to fetch settings:', error);
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setMessageType('');
    try {
      await Promise.all([
        api.put('/api/settings/autoApproveProducts', {
          value: settings.autoApproveProducts,
          description: 'Auto-approve products from approved operators',
        }),
        api.put('/api/settings/autoApproveReviews', {
          value: settings.autoApproveReviews,
          description: 'Auto-approve reviews from approved users',
        }),
      ]);
      setMessage(t('admin.settings.save_success'));
      setMessageType('success');
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    } catch (error) {
      setMessage(t('admin.settings.save_error'));
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">{t('admin.settings.title')}</h1>
        <DashboardNavBar />
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${messageType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings size={24} className="text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">{t('admin.settings.auto_approval_title')}</h2>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">{t('admin.settings.badge_management_title')}</h3>
          <p className="text-sm text-blue-700 mb-4">
            {t('admin.settings.badge_management_desc')}
          </p>
          <Link
            to="/admin/badges"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
          >
            <Award size={20} />
            {t('admin.settings.manage_badges')}
          </Link>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">{t('admin.settings.auto_approve_products_title')}</h3>
              <p className="text-sm text-gray-600">
                {t('admin.settings.auto_approve_products_desc')}
              </p>
            </div>
            <button
              onClick={() => handleToggle('autoApproveProducts')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoApproveProducts ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoApproveProducts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">{t('admin.settings.auto_approve_reviews_title')}</h3>
              <p className="text-sm text-gray-600">
                {t('admin.settings.auto_approve_reviews_desc')}
              </p>
            </div>
            <button
              onClick={() => handleToggle('autoApproveReviews')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoApproveReviews ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoApproveReviews ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 px-6 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          <Save size={20} />
          {saving ? t('admin.common.saving') : t('admin.settings.save_settings')}
        </button>
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default AdminSettingsPage;
