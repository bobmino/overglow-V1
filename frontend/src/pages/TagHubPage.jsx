import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../config/axios';
import BlogCard from '../components/BlogCard';
import ProductCard from '../components/ProductCard';
import { Hash, ArrowLeft, Search } from 'lucide-react';

const slugToTag = (slug) => decodeURIComponent(String(slug || '').replace(/-/g, ' ')).trim();

const TagHubPage = () => {
  const { tag: tagSlug } = useParams();
  const tag = useMemo(() => slugToTag(tagSlug), [tagSlug]);

  const [loading, setLoading] = useState(true);
  const [blogPosts, setBlogPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all | blog | experiences

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [blogRes, searchRes] = await Promise.all([
          api.get(`/api/blog?tag=${encodeURIComponent(tag)}&limit=12&sortBy=publishedAt`),
          // Best-effort: reuse advanced search to find experiences matching this tag keyword
          api.get(`/api/search/advanced?q=${encodeURIComponent(tag)}&limit=12&page=1`),
        ]);

        setBlogPosts(Array.isArray(blogRes.data?.posts) ? blogRes.data.posts : []);
        setProducts(Array.isArray(searchRes.data?.products) ? searchRes.data.products : []);
      } catch (e) {
        setBlogPosts([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (tag) fetchAll();
  }, [tag]);

  const totalCount = blogPosts.length + products.length;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <Helmet>
        <title>#{tag} — Résultats | Overglow Trip</title>
        <meta name="description" content={`Tous les contenus Overglow Trip liés au tag ${tag}: articles et expériences.`} />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Helmet>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link to="/blog" className="inline-flex items-center gap-2 text-slate-600 hover:text-primary-600 transition">
            <ArrowLeft size={18} />
            Retour au blog
          </Link>
          <Link
            to={`/search?q=${encodeURIComponent(tag)}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
          >
            <Search size={16} />
            Rechercher “{tag}”
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
              <Hash size={18} className="text-primary-700" />
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">#{tag}</h1>
              <p className="text-slate-600 text-sm">
                {loading ? 'Chargement…' : `${totalCount} résultat(s) indexé(s)`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { key: 'all', label: `Tout (${totalCount})` },
              { key: 'blog', label: `Articles (${blogPosts.length})` },
              { key: 'experiences', label: `Expériences (${products.length})` },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-xl font-bold border transition ${
                  activeTab === t.key
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl h-72 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-900 text-xl font-extrabold mb-2">Aucun résultat</p>
            <p className="text-slate-600 mb-6">
              Aucun article publié ou expérience ne correspond encore à <span className="font-semibold">#{tag}</span>.
            </p>
            <Link
              to="/blog"
              className="px-6 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition inline-flex"
            >
              Explorer le blog
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {(activeTab === 'all' || activeTab === 'blog') && blogPosts.length > 0 && (
              <section>
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-4">Articles</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {blogPosts.map((p) => (
                    <BlogCard key={p._id || p.slug} post={p} />
                  ))}
                </div>
              </section>
            )}

            {(activeTab === 'all' || activeTab === 'experiences') && products.length > 0 && (
              <section>
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-4">Expériences</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagHubPage;


