import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight } from 'lucide-react';

const BlogPage = () => {
  const posts = [
    {
      id: 1,
      title: 'Les 10 meilleures destinations pour 2025',
      excerpt: 'Découvrez les destinations les plus tendances pour votre prochaine aventure.',
      author: 'Équipe Overglow',
      date: '2025-01-15',
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
    },
    {
      id: 2,
      title: 'Comment voyager de manière responsable',
      excerpt: 'Conseils pratiques pour un tourisme durable et respectueux de l\'environnement.',
      author: 'Équipe Overglow',
      date: '2025-01-10',
      image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
    },
    {
      id: 3,
      title: 'Guide complet : Organiser votre premier voyage solo',
      excerpt: 'Tout ce que vous devez savoir pour partir en toute sécurité et profiter pleinement.',
      author: 'Équipe Overglow',
      date: '2025-01-05',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog Overglow-Trip</h1>
          <p className="text-xl text-gray-600">Conseils, guides et actualités du voyage</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {posts.map((post) => (
            <article key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <User size={16} />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    {new Date(post.date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h2>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <Link
                  to={`/blog/${post.id}`}
                  className="text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-2"
                >
                  Lire la suite
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Plus d'articles à venir bientôt !</p>
          <Link
            to="/"
            className="text-primary-600 font-semibold hover:text-primary-700"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;

