import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Eye, Tag } from 'lucide-react';

const BlogCard = ({ post }) => {
  if (!post) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Link 
      to={`/blog/${post.slug}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:-translate-y-1"
    >
      {/* Featured Image */}
      <div className="relative h-64 overflow-hidden bg-slate-200">
        <img 
          src={post.featuredImage || 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800'} 
          alt={post.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-out"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800';
          }}
        />
        {post.featured && (
          <div className="absolute top-4 left-4 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold">
            À la une
          </div>
        )}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold text-slate-700">
          {post.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Meta Info */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            {formatDate(post.publishedAt)}
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            {post.readingTime || 5} min
          </div>
          {post.views > 0 && (
            <div className="flex items-center gap-1">
              <Eye size={14} />
              {post.views}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-xl text-slate-900 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-slate-600 text-sm mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs"
              >
                <Tag size={12} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Read More */}
        <div className="text-primary-600 font-semibold text-sm group-hover:underline">
          Lire la suite →
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;

