import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { User, Mail, Lock, AlertCircle, Building2, MapPin, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFormValidation } from '../hooks/useFormValidation';
import FormField from '../components/FormField';
import { trackSignUp } from '../utils/analytics';

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, labelKey: 'auth.register.strength_empty', color: 'bg-gray-200' };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) return { score, labelKey: 'auth.register.strength_weak', color: 'bg-red-500' };
  if (score <= 3) return { score, labelKey: 'auth.register.strength_medium', color: 'bg-amber-500' };
  return { score, labelKey: 'auth.register.strength_strong', color: 'bg-emerald-600' };
};

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState('traveler'); // traveler | operator
  const [acceptTerms, setAcceptTerms] = useState(false);

  const from = location.state?.from?.pathname || '/';
  const fromState = location.state?.from?.state || {};
  const isOperatorPath = location.pathname.includes('operator');

  React.useEffect(() => {
    if (isOperatorPath) setAccountType('operator');
  }, [isOperatorPath]);

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
      companyName: '',
      activityType: '',
      city: '',
    },
    {
      name: ['required', { type: 'minLength', value: 2, message: t('auth.register.err_name_min') }],
      email: ['required', 'email'],
      password: ['required', { type: 'minLength', value: 6, message: t('auth.register.err_password_min') }],
      confirmPassword: [
        'required',
        (value) => (formData.password !== value ? t('auth.register.err_password_match') : ''),
      ],
    }
  );

  const strength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!acceptTerms) {
      setSubmitError(t('auth.register.err_terms'));
      return;
    }

    if (accountType === 'operator') {
      if (!formData.companyName?.trim() || !formData.activityType?.trim() || !formData.city?.trim()) {
        setSubmitError(t('auth.register.err_operator_fields'));
        return;
      }
    }

    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: accountType === 'operator' ? 'Opérateur' : 'Client',
      };
      if (accountType === 'operator') {
        payload.companyName = formData.companyName.trim();
        payload.description = `${formData.activityType.trim()} — ${formData.city.trim()}`;
        payload.city = formData.city.trim();
        payload.activityType = formData.activityType.trim();
      }

      const { data } = await api.post('/api/auth/register', payload);
      const userData = { ...data, refreshToken: data.refreshToken || null };
      login(userData);
      trackSignUp('email');

      if (accountType === 'operator') {
        navigate('/operator/onboarding', { replace: true });
      } else if (from && from !== '/') {
        navigate(from, { state: fromState, replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
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
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {submitError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle size={20} className="text-red-600 me-3 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset>
              <legend className="text-sm font-semibold text-gray-800 mb-2">
                {t('auth.register.account_type')}
              </legend>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType('traveler')}
                  className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    accountType === 'traveler'
                      ? 'border-primary-600 bg-primary-50 text-primary-800'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t('auth.register.type_traveler')}
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('operator')}
                  className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    accountType === 'operator'
                      ? 'border-primary-600 bg-primary-50 text-primary-800'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t('auth.register.type_operator')}
                </button>
              </div>
            </fieldset>

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
            />

            {accountType === 'operator' && (
              <>
                <FormField
                  label={t('auth.register.company_label')}
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('auth.register.company_placeholder')}
                  required
                  icon={Building2}
                />
                <FormField
                  label={t('auth.register.activity_label')}
                  name="activityType"
                  type="text"
                  value={formData.activityType}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('auth.register.activity_placeholder')}
                  required
                  icon={Briefcase}
                />
                <FormField
                  label={t('auth.register.city_label')}
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('auth.register.city_placeholder')}
                  required
                  icon={MapPin}
                />
              </>
            )}

            <div>
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
              />
              <div className="mt-2">
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full transition-all ${strength.color}`}
                    style={{ width: `${Math.min(100, (strength.score / 5) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{t(strength.labelKey)}</p>
              </div>
            </div>

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
            />

            <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 min-h-4 min-w-4"
              />
              <span>
                {t('auth.register.terms_prefix')}{' '}
                <Link to="/terms" className="text-primary-700 font-semibold underline" target="_blank">
                  {t('auth.register.terms_link')}
                </Link>{' '}
                {t('auth.register.and')}{' '}
                <Link to="/privacy" className="text-primary-700 font-semibold underline" target="_blank">
                  {t('auth.register.privacy_link')}
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className={`w-full min-h-11 py-3 rounded-lg font-bold text-white transition ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'
              }`}
            >
              {loading ? t('auth.register.submitting') : t('auth.register.submit')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t('auth.register.has_account')}{' '}
              <Link
                to="/login"
                state={{ from: location.state?.from }}
                className="text-green-700 font-semibold hover:underline"
              >
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
