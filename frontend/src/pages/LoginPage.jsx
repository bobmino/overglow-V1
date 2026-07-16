import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFormValidation } from '../hooks/useFormValidation';
import FormField from '../components/FormField';
import { trackLogin } from '../utils/analytics';
import { logger } from '../utils/logger.js';

const REMEMBER_KEY = 'overglow_remember_email';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const from = location.state?.from?.pathname || '/';
  const fromState = location.state?.from?.state || {};

  const {
    values: formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    setValues,
  } = useFormValidation(
    { email: '', password: '' },
    {
      email: ['required', 'email'],
      password: ['required', { type: 'minLength', value: 6, message: t('auth.login.err_password_min') }],
    }
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setValues((prev) => ({ ...prev, email: saved }));
        setRememberMe(true);
        setForgotEmail(saved);
      }
    } catch {
      /* ignore */
    }
  }, [setValues]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', {
        email: formData.email,
        password: formData.password,
      });
      const userData = { ...data, refreshToken: data.refreshToken || null };
      login(userData);
      trackLogin('email');

      try {
        if (rememberMe) localStorage.setItem(REMEMBER_KEY, formData.email);
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        /* ignore */
      }

      const role = String(data.role || '').toLowerCase();
      if (from && from !== '/') {
        navigate(from, { state: fromState, replace: true });
      } else if (role.includes('admin')) {
        navigate('/admin/dashboard', { replace: true });
      } else if (role.includes('op') || role.includes('operator')) {
        navigate('/operator/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      logger.error('Login error:', err);
      setSubmitError(err.response?.data?.message || t('auth.login.err_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    if (!forgotEmail.trim()) {
      setForgotError(t('auth.login.forgot_email_required'));
      return;
    }
    setForgotLoading(true);
    try {
      const { data } = await api.post('/api/auth/forgot-password', { email: forgotEmail.trim() });
      setForgotMessage(data.message || t('auth.login.forgot_success'));
    } catch (err) {
      setForgotError(err.response?.data?.message || t('auth.login.forgot_error'));
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.login.title')}</h1>
          <p className="text-gray-600">{t('auth.login.subtitle')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {submitError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle size={20} className="text-red-600 me-3 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          )}

          {!showForgot ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <FormField
                label={t('auth.login.email_label')}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.email}
                touched={touched.email}
                placeholder={t('auth.login.email_placeholder')}
                required
                icon={Mail}
                autoComplete="email"
              />

              <FormField
                label={t('auth.login.password_label')}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.password}
                touched={touched.password}
                placeholder="••••••••"
                required
                icon={Lock}
                autoComplete="current-password"
              />

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="inline-flex items-center gap-2 cursor-pointer text-gray-700">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="min-h-4 min-w-4"
                  />
                  {t('auth.login.remember_me')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(true);
                    setForgotEmail(formData.email || '');
                    setForgotMessage('');
                    setForgotError('');
                  }}
                  className="text-primary-700 font-semibold hover:underline"
                >
                  {t('auth.login.forgot_password')}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full min-h-11 py-3 rounded-lg font-bold text-white transition ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-700 hover:bg-primary-800'
                }`}
              >
                {loading ? t('auth.login.submitting') : t('auth.login.submit')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgot} className="space-y-5">
              <p className="text-sm text-gray-600">{t('auth.login.forgot_intro')}</p>
              {forgotMessage && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 flex gap-2 text-sm text-primary-800">
                  <CheckCircle size={18} className="shrink-0 mt-0.5" />
                  {forgotMessage}
                </div>
              )}
              {forgotError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {forgotError}
                </div>
              )}
              <FormField
                label={t('auth.login.email_label')}
                name="forgotEmail"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder={t('auth.login.email_placeholder')}
                required
                icon={Mail}
              />
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full min-h-11 py-3 rounded-lg font-bold text-white bg-primary-700 hover:bg-primary-800 disabled:bg-gray-400"
              >
                {forgotLoading ? t('auth.login.forgot_sending') : t('auth.login.forgot_submit')}
              </button>
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="w-full text-sm font-semibold text-gray-600 hover:text-gray-900"
              >
                {t('auth.login.forgot_back')}
              </button>
            </form>
          )}

          {!showForgot && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-gray-400 uppercase tracking-wide">
                <div className="flex-1 h-px bg-gray-200" />
                {t('auth.login.or_continue')}
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled
                  title={t('auth.login.social_soon')}
                  className="min-h-11 rounded-lg border border-gray-200 text-sm font-semibold text-gray-400 cursor-not-allowed"
                >
                  Google
                </button>
                <button
                  type="button"
                  disabled
                  title={t('auth.login.social_soon')}
                  className="min-h-11 rounded-lg border border-gray-200 text-sm font-semibold text-gray-400 cursor-not-allowed"
                >
                  Facebook
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-gray-400">{t('auth.login.social_soon')}</p>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t('auth.login.no_account')}{' '}
              <Link
                to="/register"
                state={{ from: location.state?.from }}
                className="text-primary-700 font-semibold hover:underline"
              >
                {t('auth.login.sign_up')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
