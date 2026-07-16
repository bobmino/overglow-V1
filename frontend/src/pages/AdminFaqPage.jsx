import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, RefreshCw, Trash2 } from 'lucide-react';
import api from '../config/axios';
import { useToast } from '../context/ToastContext';
import { logger } from '../utils/logger.js';
import { askConfirm } from '../utils/notify.js';

const AdminFaqPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [language, setLanguage] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: '50',
      });
      if (language !== 'all') params.set('language', language);
      const { data } = await api.get(`/api/faq/admin/all?${params.toString()}`);
      setFaqs(Array.isArray(data.faqs) ? data.faqs : []);
      setPagination((prev) => ({
        ...prev,
        ...(data.pagination || {}),
      }));
    } catch (err) {
      logger.error('Admin FAQ fetch failed:', err);
      toast(t('admin.faq.load_error'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, pagination.page]);

  const handleSeed = async () => {
    const ok = await askConfirm(t('admin.faq.seed_confirm'), {
      confirmLabel: t('common.confirm', 'OK'),
      cancelLabel: t('common.cancel', 'Annuler'),
    });
    if (!ok) return;
    try {
      setSeeding(true);
      const { data } = await api.post('/api/faq/admin/initialize');
      toast(
        t('admin.faq.seed_success', {
          created: data.created ?? 0,
          skipped: data.skipped ?? 0,
        }),
        { type: 'success' }
      );
      fetchFaqs();
    } catch (err) {
      logger.error('FAQ seed failed:', err);
      toast(err.response?.data?.message || t('admin.faq.seed_error'), { type: 'error' });
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await askConfirm(t('admin.faq.delete_confirm'), {
      confirmLabel: t('common.delete', 'Supprimer'),
      cancelLabel: t('common.cancel', 'Annuler'),
    });
    if (!ok) return;
    try {
      await api.delete(`/api/faq/${id}`);
      toast(t('admin.faq.delete_success'), { type: 'success' });
      fetchFaqs();
    } catch (err) {
      toast(err.response?.data?.message || t('admin.faq.delete_error'), { type: 'error' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="text-primary-600" />
            {t('admin.faq.title')}
          </h1>
          <p className="text-slate-600 mt-1">{t('admin.faq.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={handleSeed}
          disabled={seeding}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-60"
        >
          <RefreshCw size={18} className={seeding ? 'animate-spin' : ''} />
          {t('admin.faq.seed_button')}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'fr', 'en', 'es', 'ar'].map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => {
              setLanguage(lang);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
              language === lang
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {lang === 'all' ? t('admin.faq.filter_all') : lang.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-slate-100 rounded-xl" />
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-900">
          <p className="font-semibold">{t('admin.faq.empty')}</p>
          <p className="text-sm mt-1">{t('admin.faq.empty_hint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <article
              key={faq._id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {(faq.language || 'fr').toUpperCase()}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
                    {faq.category}
                  </span>
                  {!faq.isActive && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                      {t('admin.faq.inactive')}
                    </span>
                  )}
                </div>
                <h2 className="font-semibold text-slate-900">{faq.question}</h2>
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{faq.answer}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(faq._id)}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-700 border border-red-200 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={16} />
                {t('common.delete', 'Supprimer')}
              </button>
            </article>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            className="px-3 py-1.5 rounded-lg bg-slate-100 disabled:opacity-40"
          >
            {t('common.previous', 'Précédent')}
          </button>
          <span className="px-3 py-1.5 text-sm text-slate-600">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            className="px-3 py-1.5 rounded-lg bg-slate-100 disabled:opacity-40"
          >
            {t('common.next', 'Suivant')}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminFaqPage;
