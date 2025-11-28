import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/axios';
import { 
  User, Mail, Lock, AlertCircle, Briefcase, 
  CheckCircle, TrendingUp, Globe, Shield, DollarSign,
  Users, BarChart3, Star, Zap, Headphones as Support
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AffiliatePage = () => {
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
  const [showForm, setShowForm] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!formData.companyName.trim()) {
      setError('Le nom de l\'entreprise est requis');
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
      // Redirect to onboarding after registration
      navigate('/operator/onboarding');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'L\'inscription a échoué. Veuillez réessayer.');
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: Globe,
      title: 'Portée mondiale',
      description: 'Accédez à des millions de voyageurs du monde entier et augmentez votre visibilité.',
    },
    {
      icon: TrendingUp,
      title: 'Croissance des revenus',
      description: 'Augmentez vos réservations et développez votre activité avec notre plateforme performante.',
    },
    {
      icon: Shield,
      title: 'Paiements sécurisés',
      description: 'Transactions sécurisées et paiements rapides pour vous et vos clients.',
    },
    {
      icon: BarChart3,
      title: 'Analyses détaillées',
      description: 'Suivez vos performances avec des statistiques et analyses en temps réel.',
    },
    {
      icon: Users,
      title: 'Gestion simplifiée',
      description: 'Outil de gestion complet pour vos produits, réservations et clients.',
    },
    {
      icon: Support,
      title: 'Support dédié',
      description: 'Équipe de support disponible pour vous accompagner dans votre croissance.',
    },
  ];

  const stats = [
    { number: '10M+', label: 'Voyageurs actifs' },
    { number: '50K+', label: 'Expériences disponibles' },
    { number: '150+', label: 'Pays couverts' },
    { number: '4.8/5', label: 'Note moyenne' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Rejoignez Overglow-Trip
              <br />
              <span className="text-primary-200">Devenez Partenaire</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8">
              Proposez vos expériences à des millions de voyageurs et développez votre activité
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4">
                  <div className="text-3xl font-bold">{stat.number}</div>
                  <div className="text-sm text-primary-100">{stat.label}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white text-primary-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary-50 transition shadow-lg"
            >
              Commencer maintenant - C'est gratuit
            </button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir Overglow-Trip ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Rejoignez la plateforme de référence pour les opérateurs touristiques
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
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
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
              Comment ça fonctionne ?
            </h2>
            <p className="text-xl text-gray-600">
              En quelques étapes simples, commencez à vendre vos expériences
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Inscrivez-vous</h3>
                <p className="text-gray-600">
                  Créez votre compte opérateur en quelques minutes. C'est gratuit et sans engagement.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Ajoutez vos expériences</h3>
                <p className="text-gray-600">
                  Remplissez le formulaire d'onboarding et ajoutez vos produits avec photos et descriptions.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Commencez à vendre</h3>
                <p className="text-gray-600">
                  Une fois approuvé, vos expériences sont visibles par des millions de voyageurs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ce que disent nos partenaires
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: 'Marie Dubois',
                company: 'Paris Tours & Co',
                text: 'Overglow-Trip a transformé notre activité. Nos réservations ont augmenté de 300% en 6 mois !',
                rating: 5,
              },
              {
                name: 'Jean Martin',
                company: 'Alpine Adventures',
                text: 'Plateforme intuitive, support réactif et paiements rapides. Tout ce dont nous avions besoin.',
                rating: 5,
              },
              {
                name: 'Sophie Laurent',
                company: 'Mediterranean Experiences',
                text: 'La meilleure décision que nous ayons prise. Notre visibilité a explosé grâce à Overglow-Trip.',
                rating: 5,
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-current" size={20} />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.company}</p>
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
              Tarification transparente
            </h2>
            <p className="text-xl text-gray-600">
              Pas de frais cachés, pas de surprises
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl p-12 shadow-2xl">
              <div className="text-center mb-8">
                <div className="text-5xl font-bold mb-2">0€</div>
                <div className="text-xl text-primary-100">Frais d'inscription</div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} />
                  <span>Inscription gratuite</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} />
                  <span>Pas de frais mensuels</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} />
                  <span>Commission uniquement sur les ventes</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} />
                  <span>Paiements rapides et sécurisés</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} />
                  <span>Support client inclus</span>
                </div>
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
                Créez votre compte opérateur
              </h2>
              <p className="text-gray-600">
                Commencez votre parcours avec Overglow-Trip dès aujourd'hui
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                  <AlertCircle size={20} className="text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom complet *
                  </label>
                  <div className="relative">
                    <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Jean Dupont"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adresse email *
                  </label>
                  <div className="relative">
                    <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="contact@votre-entreprise.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom de l'entreprise *
                  </label>
                  <div className="relative">
                    <Briefcase size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Votre Entreprise"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirmer le mot de passe *
                  </label>
                  <div className="relative">
                    <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="••••••••"
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
                  {loading ? 'Création du compte...' : 'Créer mon compte opérateur'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                  En vous inscrivant, vous acceptez nos{' '}
                  <Link to="/terms" className="text-primary-600 font-semibold hover:underline">
                    Conditions d'utilisation
                  </Link>
                  {' '}et notre{' '}
                  <Link to="/privacy" className="text-primary-600 font-semibold hover:underline">
                    Politique de confidentialité
                  </Link>
                </p>
                <p className="text-gray-600 mt-4">
                  Vous avez déjà un compte ?{' '}
                  <Link to="/login" className="text-primary-600 font-semibold hover:underline">
                    Se connecter
                  </Link>
                </p>
                <p className="text-gray-600 mt-2">
                  Vous êtes un voyageur ?{' '}
                  <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                    Inscrivez-vous ici
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
              <h3 className="text-white font-bold mb-4">À propos</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="hover:text-white transition">Qui sommes-nous</Link></li>
                <li><Link to="/careers" className="hover:text-white transition">Carrières</Link></li>
                <li><Link to="/press" className="hover:text-white transition">Presse</Link></li>
                <li><Link to="/blog" className="hover:text-white transition">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Pour les opérateurs</h3>
              <ul className="space-y-2">
                <li><Link to="/affiliate" className="hover:text-white transition">Devenir partenaire</Link></li>
                <li><Link to="/operator/help" className="hover:text-white transition">Centre d'aide</Link></li>
                <li><Link to="/operator/resources" className="hover:text-white transition">Ressources</Link></li>
                <li><Link to="/operator/community" className="hover:text-white transition">Communauté</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link to="/help" className="hover:text-white transition">Centre d'aide</Link></li>
                <li><Link to="/contact" className="hover:text-white transition">Nous contacter</Link></li>
                <li><Link to="/faq" className="hover:text-white transition">FAQ</Link></li>
                <li><Link to="/safety" className="hover:text-white transition">Sécurité</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Légal</h3>
              <ul className="space-y-2">
                <li><Link to="/terms" className="hover:text-white transition">Conditions d'utilisation</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition">Confidentialité</Link></li>
                <li><Link to="/cookies" className="hover:text-white transition">Cookies</Link></li>
                <li><Link to="/accessibility" className="hover:text-white transition">Accessibilité</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} Overglow-Trip. Tous droits réservés.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AffiliatePage;

