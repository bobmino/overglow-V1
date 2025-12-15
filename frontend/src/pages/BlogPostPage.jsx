import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../config/axios';
import BlogCard from '../components/BlogCard';
import ShareButtons from '../components/ShareButtons';
import { Calendar, Clock, Eye, Tag, ArrowLeft, User } from 'lucide-react';
import { trackBlogView } from '../utils/analytics';

const BlogPostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/api/blog/${slug}`);
        setPost(data);
        setRelatedPosts(data.relatedPosts || []);
        
        // Track blog view
        if (data) {
          trackBlogView({
            id: data._id,
            _id: data._id,
            title: data.title,
            category: data.category,
            tags: data.tags,
          });
        }
      } catch (err) {
        console.error('Failed to fetch blog post:', err);
        setError('Article non trouvé');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 pt-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-96 bg-slate-200 rounded-xl"></div>
              <div className="h-8 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 pt-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Article non trouvé</h1>
            <p className="text-slate-600 mb-6">{error || 'Cet article n\'existe pas ou a été supprimé.'}</p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              <ArrowLeft size={18} />
              Retour au blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 pt-24">
      <Helmet>
        <title>{post.metaTitle || post.title} | Overglow Trip Blog</title>
        <meta name="description" content={post.metaDescription || post.excerpt} />
        <meta property="og:title" content={post.metaTitle || post.title} />
        <meta property="og:description" content={post.metaDescription || post.excerpt} />
        <meta property="og:image" content={post.featuredImage || 'https://overglow-v1-3jqp.vercel.app/vite.svg'} />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta property="og:type" content="article" />
        <meta name="keywords" content={post.keywords?.join(', ')} />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Helmet>

      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/blog')}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-primary-600 transition"
        >
          <ArrowLeft size={18} />
          Retour au blog
        </button>

        <div className="max-w-4xl mx-auto">
          {/* Featured Image */}
          {post.featuredImage && (
            <div className="mb-8 rounded-xl overflow-hidden">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-96 object-cover"
                loading="eager"
              />
            </div>
          )}

          {/* Article Header */}
          <div className="bg-white rounded-xl p-8 mb-8 shadow-sm">
            {/* Category and Featured Badge */}
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                {post.category}
              </span>
              {post.featured && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                  À la une
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 mb-6 pb-6 border-b border-slate-200">
              {post.author && (
                <div className="flex items-center gap-2">
                  <User size={16} />
                  <span>{post.author.name || 'Équipe Overglow'}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{formatDate(post.publishedAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{post.readingTime || 5} min de lecture</span>
              </div>
              {post.views > 0 && (
                <div className="flex items-center gap-2">
                  <Eye size={16} />
                  <span>{post.views} vues</span>
                </div>
              )}
            </div>

            {/* Share Buttons */}
            <ShareButtons
              product={post}
              url={typeof window !== 'undefined' ? window.location.href : ''}
              title={post.title}
              description={post.excerpt}
              contentType="blog_post"
            />
          </div>

          {/* Article Content */}
          <div className="bg-white rounded-xl p-8 mb-8 shadow-sm">
            <div
              className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-primary-600 prose-strong:text-slate-900 prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Tag size={20} />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <Link
                    key={index}
                    to={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm hover:bg-primary-100 hover:text-primary-700 transition"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Products */}
          {post.relatedProducts && post.relatedProducts.length > 0 && (
            <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">
                Expériences liées
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {post.relatedProducts.map((product) => (
                  <Link
                    key={product._id}
                    to={`/products/${product._id}`}
                    className="flex gap-4 p-4 border border-slate-200 rounded-lg hover:border-primary-500 transition"
                  >
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=200'}
                      alt={product.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">{product.title}</h4>
                      <p className="text-sm text-slate-600">{product.city}</p>
                      <p className="text-primary-600 font-semibold mt-2">
                        À partir de {product.price}€
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">
                Articles similaires
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <BlogCard key={relatedPost._id || relatedPost.slug} post={relatedPost} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;

