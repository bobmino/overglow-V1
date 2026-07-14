import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../config/axios';
import FormField from '../components/FormField';

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError(t('auth.reset.err_token'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.reset.err_password_min'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.reset.err_password_match'));
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(`/api/auth/reset-password/${token}`, { password });
      setSuccess(data.message || t('auth.reset.success'));
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.reset.err_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.reset.title')}</h1>
        <p className="text-gray-600 mb-6">{t('auth.reset.subtitle')}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2" role="alert">
            <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2" role="status">
            <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label={t('auth.reset.password_label')}
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
            required
            autoComplete="new-password"
          />
          <FormField
            label={t('auth.reset.confirm_label')}
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={Lock}
            required
            autoComplete="new-password"
          />
          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition font-semibold"
          >
            {loading ? t('auth.reset.submitting') : t('auth.reset.submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link to="/login" className="text-primary-600 hover:underline font-medium">
            {t('auth.reset.back_login')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
