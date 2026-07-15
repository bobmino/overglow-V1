import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LocalizedLink from '../components/LocalizedLink';
import api from '../config/axios';
import BlogCard from '../components/BlogCard';
import SEOHead from '../components/SEOHead';
import { logger } from '../utils/logger.js';

const BlogPage = () => {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const lang = (i18n.language || 'fr').slice(0, 2);
        const { data } = await api.get('/api/blog', {
          params: { page, limit: 12, language: lang },
        });
        if (!cancelled) {
          setPosts(Array.isArray(data?.posts) ? data.posts : []);
          setTotalPages(data?.pagination?.totalPages || 1);
        }
      } catch (err) {
        logger.error('Blog list error:', err);
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [i18n.language, page]);

  return (
    <>
      <SEOHead
        title={t('blog.meta_title')}
        description={t('blog.meta_description')}
        pathname="/blog"
      />

      <div className="min-h-screen bg-slate-50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-heading font-bold text-slate-900 mb-3">{t('blog.title')}</h1>
            <p className="text-slate-600 max-w-2xl mx-auto">{t('blog.subtitle')}</p>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-500">{t('common.loading')}</div>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-100">
              <p className="text-lg font-semibold text-slate-900 mb-2">{t('blog.empty')}</p>
              <p className="text-slate-600 mb-6">{t('blog.empty_hint')}</p>
              <LocalizedLink
                to="/search"
                className="inline-flex px-5 py-2.5 rounded-xl bg-primary-600 text-white font-semibold"
              >
                {t('blog.cta_explore')}
              </LocalizedLink>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <BlogCard key={post._id} post={post} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold ${
                        p === page
                          ? 'bg-primary-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogPage;
