import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFormValidation } from '../hooks/useFormValidation';
import FormField from '../components/FormField';
import { trackSignUp } from '../utils/analytics';

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  // Capture where the user came from
  const from = location.state?.from?.pathname || '/';
  const fromState = location.state?.from?.state || {};

  const {
    values: formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
  } = useFormValidation(
    {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    {
      name: ['required', { type: 'minLength', value: 2, message: t('auth.register.err_name_min') }],
      email: ['required', 'email'],
      password: ['required', { type: 'minLength', value: 6, message: t('auth.register.err_password_min') }],
      confirmPassword: [
        'required',
        (value) => formData.password !== value ? t('auth.register.err_password_match') : ''
      ],
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'Client', // Always Client for this page
      });
      // Store both access token and refresh token
      const userData = {
        ...data,
        refreshToken: data.refreshToken || null
      };
      login(userData);
      // Track sign up
      trackSignUp('email');
      
      // Redirect back to where the user came from with state
      navigate(from, { state: fromState, replace: true });
    } catch (err) {
      setSubmitError(err.response?.data?.message || t('auth.register.err_failed'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.register.title')}</h1>
          <p className="text-gray-600">{t('auth.register.subtitle')}</p>
          <p className="text-sm text-gray-500 mt-2">
            {t('auth.register.operator_prompt')}{' '}
            <Link to="/affiliate" className="text-primary-600 font-semibold hover:underline">
              {t('auth.register.operator_link')}
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8" role="form" aria-labelledby="register-title">
          {submitError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle size={20} className="text-red-600 me-3 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" aria-labelledby="register-title">
            <FormField
              label={t('auth.register.name_label')}
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.name}
              touched={touched.name}
              placeholder={t('auth.register.name_placeholder')}
              required
              icon={User}
              autoComplete="name"
              helpText={t('auth.register.name_help')}
            />

            <FormField
              label={t('auth.register.email_label')}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              touched={touched.email}
              placeholder={t('auth.register.email_placeholder')}
              required
              icon={Mail}
              autoComplete="email"
              helpText={t('auth.register.email_help')}
            />

            <FormField
              label={t('auth.register.password_label')}
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
              autoComplete="new-password"
              helpText={t('auth.register.password_help')}
            />

            <FormField
              label={t('auth.register.confirm_label')}
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.confirmPassword}
              touched={touched.confirmPassword}
              placeholder="••••••••"
              required
              icon={Lock}
              autoComplete="new-password"
              helpText={t('auth.register.confirm_help')}
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold text-white transition ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-700 hover:bg-green-800'
              }`}
            >
              {loading ? t('auth.register.submitting') : t('auth.register.submit')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t('auth.register.has_account')}{' '}
              <Link to="/login" state={{ from: location.state?.from }} className="text-green-700 font-semibold hover:underline">
                {t('auth.register.sign_in')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
