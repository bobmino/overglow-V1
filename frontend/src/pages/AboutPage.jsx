import React from 'react';
import { Globe, Users, Heart, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <Globe className="mx-auto h-20 w-20 mb-6" />
          <h1 className="text-5xl font-bold mb-6">À propos d'Overglow-Trip</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Nous connectons les voyageurs du monde entier avec des expériences authentiques et mémorables
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Notre Mission</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Chez Overglow-Trip, nous croyons que chaque voyage devrait être une aventure unique et authentique. 
              Notre mission est de connecter les voyageurs avec des expériences locales exceptionnelles tout en 
              soutenant les opérateurs touristiques locaux.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Nous construisons une plateforme qui valorise la qualité, l'authenticité et le respect des communautés 
              locales, tout en offrant une expérience de réservation simple et sécurisée.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Nos Valeurs</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="text-primary-600" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Authenticité</h3>
              <p className="text-gray-600">
                Nous privilégions les expériences authentiques qui reflètent la vraie culture locale.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="text-primary-600" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Communauté</h3>
              <p className="text-gray-600">
                Nous soutenons les opérateurs locaux et contribuons au développement durable du tourisme.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="text-primary-600" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Excellence</h3>
              <p className="text-gray-600">
                Nous nous engageons à offrir la meilleure expérience possible à nos utilisateurs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">10M+</div>
              <div className="text-gray-600">Voyageurs actifs</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">50K+</div>
              <div className="text-gray-600">Expériences disponibles</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">150+</div>
              <div className="text-gray-600">Pays couverts</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">4.8/5</div>
              <div className="text-gray-600">Note moyenne</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Rejoignez-nous</h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Que vous soyez un voyageur à la recherche d'aventures ou un opérateur souhaitant partager vos expériences, 
            Overglow-Trip est fait pour vous.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-bold hover:bg-primary-50 transition"
            >
              Créer un compte
            </Link>
            <Link
              to="/affiliate"
              className="bg-primary-700 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-800 transition"
            >
              Devenir partenaire
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

