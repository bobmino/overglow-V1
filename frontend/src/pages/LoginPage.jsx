import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFormValidation } from '../hooks/useFormValidation';
import FormField from '../components/FormField';
import { trackLogin } from '../utils/analytics';

const LoginPage = () => {
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
      email: '',
      password: ''
    },
    {
      email: ['required', 'email'],
      password: ['required', { type: 'minLength', value: 6, message: t('auth.login.err_password_min') }],
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    // Validate form
    // Note: validate() updates errors state asynchronously, so we need to check the result directly
    const isValid = validate();
    
    // Use setTimeout to check errors after state update
    if (!isValid) {
      setTimeout(() => {
        console.log('❌ Form validation failed (after state update):', {
          errors: errors,
          email: formData.email,
          passwordLength: formData.password?.length,
          emailError: errors.email,
          passwordError: errors.password
        });
      }, 100);
      return;
    }

    setLoading(true);

    try {
      // Log request for debugging (always log for troubleshooting)
      console.log('🔐 Login attempt:', { 
        email: formData.email, 
        passwordLength: formData.password?.length,
        baseURL: api.defaults.baseURL || 'relative',
        fullURL: `${api.defaults.baseURL || ''}/api/auth/login`,
        hasErrors: Object.keys(errors).length > 0,
        errors: errors
      });

      const { data } = await api.post('/api/auth/login', formData);
      
      console.log('✅ Login successful:', { userId: data._id, role: data.role });
      
      // Store both access token and refresh token
      const userData = {
        ...data,
        refreshToken: data.refreshToken || null
      };
      login(userData);
      // Track login
      trackLogin('email');
      
      // Redirect back to where the user came from with state
      navigate(from, { state: fromState, replace: true });
    } catch (err) {
      // Enhanced error logging (always log for troubleshooting)
      console.error('❌ Login error:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: err.config?.url,
        baseURL: err.config?.baseURL,
        fullURL: err.config?.baseURL + err.config?.url,
        hasRequest: !!err.request,
        code: err.code,
        name: err.name
      });

      const errorData = err.response?.data;
      let errorMessage = t('auth.login.err_failed');
      
      if (errorData) {
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (err.message) {
        errorMessage = err.message;
      } else if (!err.response && err.request) {
        errorMessage = t('auth.login.err_network');
      }
      
      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.login.title')}</h1>
          <p className="text-gray-600">{t('auth.login.subtitle')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8" role="form" aria-labelledby="login-title">
          {submitError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle size={20} className="text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
              helpText={t('auth.login.email_help')}
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
              helpText={t('auth.login.password_help')}
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
              {loading ? t('auth.login.submitting') : t('auth.login.submit')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t('auth.login.no_account')}{' '}
              <Link to="/register" state={{ from: location.state?.from }} className="text-green-700 font-semibold hover:underline">
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
