import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/axios';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFormValidation } from '../hooks/useFormValidation';
import FormField from '../components/FormField';
import { trackSignUp } from '../utils/analytics';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

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
      name: ['required', { type: 'minLength', value: 2, message: 'Le nom doit contenir au moins 2 caractères' }],
      email: ['required', 'email'],
      password: ['required', { type: 'minLength', value: 6, message: 'Le mot de passe doit contenir au moins 6 caractères' }],
      confirmPassword: [
        'required',
        (value) => formData.password !== value ? 'Les mots de passe ne correspondent pas' : ''
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
      navigate('/');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer votre compte</h1>
          <p className="text-gray-600">Rejoignez Overglow-Trip dès aujourd'hui</p>
          <p className="text-sm text-gray-500 mt-2">
            Vous êtes un opérateur ?{' '}
            <Link to="/affiliate" className="text-primary-600 font-semibold hover:underline">
              Inscrivez-vous ici
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8" role="form" aria-labelledby="register-title">
          {submitError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle size={20} className="text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" aria-labelledby="register-title">
            <FormField
              label="Nom complet"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.name}
              touched={touched.name}
              placeholder="John Doe"
              required
              icon={User}
              autoComplete="name"
              helpText="Votre nom complet"
            />

            <FormField
              label="Adresse email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              touched={touched.email}
              placeholder="you@example.com"
              required
              icon={Mail}
              autoComplete="email"
              helpText="Nous ne partagerons jamais votre email"
            />

            <FormField
              label="Mot de passe"
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
              helpText="Au moins 6 caractères"
            />

            <FormField
              label="Confirmer le mot de passe"
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
              helpText="Répétez le mot de passe pour confirmation"
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
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Vous avez déjà un compte ?{' '}
              <Link to="/login" className="text-green-700 font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
