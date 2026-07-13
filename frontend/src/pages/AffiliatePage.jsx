import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import {
  User,
  Mail,
  Lock,
  AlertCircle,
  Briefcase,
  CheckCircle,
  TrendingUp,
  Globe,
  Shield,
  Users,
  BarChart3,
  Star,
  Headphones as Support,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AffiliatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('affiliate.err_password_match'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('affiliate.err_password_length'));
      return;
    }

    if (!formData.companyName.trim()) {
      setError(t('affiliate.err_company'));
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'Opérateur',
        companyName: formData.companyName,
      });
      login(data);
      navigate('/operator/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || t('affiliate.err_register'));
      setLoading(false);
    }
  };

  const benefitIcons = [Globe, TrendingUp, Shield, BarChart3, Users, Support];

  const benefits = benefitIcons.map((icon, index) => ({
    icon,
    titleKey: `affiliate.benefit_${index + 1}_title`,
    bodyKey: `affiliate.benefit_${index + 1}_body`,
  }));

  const stats = [
    { numberKey: 'affiliate.stat_destinations', labelKey: 'affiliate.stat_destinations_label' },
    { numberKey: 'affiliate.stat_partners', labelKey: 'affiliate.stat_partners_label' },
    { numberKey: 'affiliate.stat_experiences', labelKey: 'affiliate.stat_experiences_label' },
    { numberKey: 'affiliate.stat_focus', labelKey: 'affiliate.stat_focus_label' },
  ];

  const steps = [
    { titleKey: 'affiliate.step1_title', bodyKey: 'affiliate.step1_body' },
    { titleKey: 'affiliate.step2_title', bodyKey: 'affiliate.step2_body' },
    { titleKey: 'affiliate.step3_title', bodyKey: 'affiliate.step3_body' },
  ];

  const testimonials = [
    { nameKey: 'affiliate.t1_name', companyKey: 'affiliate.t1_company', textKey: 'affiliate.t1_text' },
    { nameKey: 'affiliate.t2_name', companyKey: 'affiliate.t2_company', textKey: 'affiliate.t2_text' },
    { nameKey: 'affiliate.t3_name', companyKey: 'affiliate.t3_company', textKey: 'affiliate.t3_text' },
  ];

  const pricingFeatures = [
    'affiliate.price_1',
    'affiliate.price_2',
    'affiliate.price_3',
    'affiliate.price_4',
    'affiliate.price_5',
  ];

  const scrollToForm = () => {
    document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {t('affiliate.hero_title')}
              <br />
              <span className="text-primary-200">{t('affiliate.hero_accent')}</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8">
              {t('affiliate.hero_subtitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4">
                  <div className="text-3xl font-bold">{t(stat.numberKey)}</div>
                  <div className="text-sm text-primary-100">{t(stat.labelKey)}</div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={scrollToForm}
              className="bg-white text-primary-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary-50 transition shadow-lg"
            >
              {t('affiliate.cta')}
            </button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('affiliate.why_title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('affiliate.why_subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
                  <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                    <Icon className="text-primary-700" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{t(benefit.titleKey)}</h3>
                  <p className="text-gray-600">{t(benefit.bodyKey)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('affiliate.how_title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('affiliate.how_subtitle')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="bg-primary-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{t(step.titleKey)}</h3>
                  <p className="text-gray-600">{t(step.bodyKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('affiliate.testimonials_title')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-current" size={20} />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">&ldquo;{t(testimonial.textKey)}&rdquo;</p>
                <div>
                  <p className="font-bold text-gray-900">{t(testimonial.nameKey)}</p>
                  <p className="text-sm text-gray-600">{t(testimonial.companyKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('affiliate.pricing_title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('affiliate.pricing_subtitle')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl p-12 shadow-2xl">
              <div className="text-center mb-8">
                <div className="text-5xl font-bold mb-2">{t('affiliate.price_zero')}</div>
                <div className="text-xl text-primary-100">{t('affiliate.price_label')}</div>
              </div>
              <div className="space-y-4 mb-8">
                {pricingFeatures.map((featureKey, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle size={24} />
                    <span>{t(featureKey)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="registration-form" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {t('affiliate.form_title')}
              </h2>
              <p className="text-gray-600">
                {t('affiliate.form_subtitle')}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                  <AlertCircle size={20} className="text-red-600 me-3 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="affiliate-name" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('affiliate.label_name')}
                  </label>
                  <div className="relative">
                    <User size={20} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      id="affiliate-name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full ps-10 pe-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="affiliate-email" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('affiliate.label_email')}
                  </label>
                  <div className="relative">
                    <Mail size={20} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      id="affiliate-email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full ps-10 pe-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="affiliate-company" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('affiliate.label_company')}
                  </label>
                  <div className="relative">
                    <Briefcase size={20} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      id="affiliate-company"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      className="w-full ps-10 pe-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      autoComplete="organization"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="affiliate-password" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('affiliate.label_password')}
                  </label>
                  <div className="relative">
                    <Lock size={20} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      id="affiliate-password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full ps-10 pe-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="affiliate-confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('affiliate.label_confirm')}
                  </label>
                  <div className="relative">
                    <Lock size={20} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      id="affiliate-confirm-password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full ps-10 pe-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-lg font-bold text-white transition ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {loading ? t('affiliate.submitting') : t('affiliate.submit')}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                  {t('affiliate.accept')}{' '}
                  <Link to="/terms" className="text-primary-600 font-semibold hover:underline">
                    {t('affiliate.terms')}
                  </Link>
                  {' '}{t('affiliate.and')}{' '}
                  <Link to="/privacy" className="text-primary-600 font-semibold hover:underline">
                    {t('affiliate.privacy')}
                  </Link>
                </p>
                <p className="text-gray-600 mt-4">
                  {t('affiliate.has_account')}{' '}
                  <Link to="/login" className="text-primary-600 font-semibold hover:underline">
                    {t('affiliate.login')}
                  </Link>
                </p>
                <p className="text-gray-600 mt-2">
                  {t('affiliate.traveler')}{' '}
                  <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                    {t('affiliate.register_here')}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Links */}
      <section className="py-12 bg-gray-900 text-gray-300">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold mb-4">{t('affiliate.footer_about')}</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="hover:text-white transition">{t('affiliate.footer_who')}</Link></li>
                <li><Link to="/careers" className="hover:text-white transition">{t('affiliate.footer_careers')}</Link></li>
                <li><Link to="/press" className="hover:text-white transition">{t('affiliate.footer_press')}</Link></li>
                <li><Link to="/blog" className="hover:text-white transition">{t('affiliate.footer_blog')}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">{t('affiliate.footer_operators')}</h3>
              <ul className="space-y-2">
                <li><Link to="/affiliate" className="hover:text-white transition">{t('affiliate.footer_partner')}</Link></li>
                <li><Link to="/operator/help" className="hover:text-white transition">{t('affiliate.footer_help')}</Link></li>
                <li><Link to="/operator/resources" className="hover:text-white transition">{t('affiliate.footer_resources')}</Link></li>
                <li><Link to="/operator/community" className="hover:text-white transition">{t('affiliate.footer_community')}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">{t('affiliate.footer_support')}</h3>
              <ul className="space-y-2">
                <li><Link to="/help" className="hover:text-white transition">{t('affiliate.footer_help')}</Link></li>
                <li><Link to="/contact" className="hover:text-white transition">{t('affiliate.footer_contact')}</Link></li>
                <li><Link to="/faq" className="hover:text-white transition">{t('affiliate.footer_faq')}</Link></li>
                <li><Link to="/safety" className="hover:text-white transition">{t('affiliate.footer_safety')}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">{t('affiliate.footer_legal')}</h3>
              <ul className="space-y-2">
                <li><Link to="/terms" className="hover:text-white transition">{t('affiliate.footer_terms')}</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition">{t('affiliate.footer_privacy')}</Link></li>
                <li><Link to="/cookies" className="hover:text-white transition">{t('affiliate.footer_cookies')}</Link></li>
                <li><Link to="/accessibility" className="hover:text-white transition">{t('affiliate.footer_a11y')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p>{t('affiliate.footer_rights', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AffiliatePage;
