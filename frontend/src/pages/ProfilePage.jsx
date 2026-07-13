import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../config/axios';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

const getDateLocale = (language) => {
  const locale = language?.slice(0, 2) || 'fr';
  if (locale === 'ar') return 'ar-MA';
  if (locale === 'es') return 'es-ES';
  if (locale === 'en') return 'en-GB';
  return 'fr-FR';
};

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const dateLocale = getDateLocale(i18n.language);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    dateOfBirth: '',
    website: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      setProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        bio: data.bio || '',
        location: data.location || '',
        dateOfBirth: data.dateOfBirth || '',
        website: data.website || '',
        socialLinks: data.socialLinks || {
          facebook: '',
          instagram: '',
          twitter: '',
          linkedin: '',
        },
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('socialLinks.')) {
      const socialKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialKey]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.put('/api/auth/profile', formData);
      setProfile(data);
      setIsEditing(false);
      setSuccess(t('profile.update_success'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError(error.response?.data?.message || t('profile.update_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        location: profile.location || '',
        dateOfBirth: profile.dateOfBirth || '',
        website: profile.website || '',
        socialLinks: profile.socialLinks || {
          facebook: '',
          instagram: '',
          twitter: '',
          linkedin: '',
        },
      });
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
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
        <h1 className="text-3xl font-bold text-gray-900">{t('profile.page_title')}</h1>
        <DashboardNavBar />
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle size={20} className="text-red-600 me-3 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle size={20} className="text-green-600 me-3 mt-0.5 flex-shrink-0" />
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={48} className="text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{formData.name || user?.name}</h2>
              <p className="text-sm text-gray-600 mb-4">{formData.email || user?.email}</p>
              {formData.location && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
                  <MapPin size={16} />
                  {formData.location}
                </div>
              )}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition flex items-center justify-center gap-2"
                >
                  <Edit2 size={18} />
                  {t('profile.edit_profile')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            {/* Personal Information */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('profile.personal_info')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('profile.full_name')}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  ) : (
                    <p className="text-gray-900">{formData.name || t('profile.not_provided')}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="profile-email" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('profile.email')}
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      id="profile-email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      autoComplete="email"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.email || t('profile.not_provided')}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="profile-phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('profile.phone')}
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <Phone size={20} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        id="profile-phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder={t('profile.phone_placeholder')}
                        autoComplete="tel"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-900">{formData.phone || t('profile.not_provided')}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="profile-date-of-birth" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('profile.date_of_birth')}
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      id="profile-date-of-birth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      autoComplete="bday"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {formData.dateOfBirth 
                        ? new Date(formData.dateOfBirth).toLocaleDateString(dateLocale)
                        : t('profile.not_provided')
                      }
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('profile.location')}
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <MapPin size={20} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder={t('profile.location_placeholder')}
                      />
                    </div>
                  ) : (
                    <p className="text-gray-900">{formData.location || t('profile.not_provided')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="mb-8 border-t pt-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('profile.about')}</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('profile.bio')}
                </label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={t('profile.bio_placeholder')}
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {formData.bio || t('profile.no_bio')}
                  </p>
                )}
              </div>
            </div>

            {/* Website & Social Links */}
            <div className="mb-8 border-t pt-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('profile.links_social')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('profile.website')}
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={t('profile.website_placeholder')}
                    />
                  ) : (
                    <p className="text-gray-900">
                      {formData.website ? (
                        <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                          {formData.website}
                        </a>
                      ) : (
                        t('profile.not_provided')
                      )}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {['facebook', 'instagram', 'twitter', 'linkedin'].map((social) => (
                    <div key={social}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">
                        {t(`profile.social_${social}`)}
                      </label>
                      {isEditing ? (
                        <input
                          type="url"
                          name={`socialLinks.${social}`}
                          value={formData.socialLinks[social]}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder={t('profile.social_placeholder', { social })}
                        />
                      ) : (
                        <p className="text-gray-900">
                          {formData.socialLinks[social] ? (
                            <a href={formData.socialLinks[social]} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                              {formData.socialLinks[social]}
                            </a>
                          ) : (
                            t('profile.not_provided')
                          )}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-4 pt-6 border-t">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? t('profile.saving') : t('profile.save')}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  {t('profile.cancel')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default ProfilePage;
