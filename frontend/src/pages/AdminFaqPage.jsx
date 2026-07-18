import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, RefreshCw, Trash2, Plus, Edit, Power } from 'lucide-react';
import api from '../config/axios';
import { useToast } from '../context/ToastContext';
import { logger } from '../utils/logger.js';
import { askConfirm } from '../utils/notify.js';

const CATEGORIES = [
  'general',
  'booking',
  'payment',
  'cancellation',
  'account',
  'operator',
  'products',
  'reviews',
  'technical',
  'safety',
];

const emptyForm = {
  question: '',
  answer: '',
  category: 'general',
  language: 'fr',
  order: 0,
  isActive: true,
};

const AdminFaqPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [language, setLanguage] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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
      toast.error(t('admin.faq.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, pagination.page]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, language: language === 'all' ? 'fr' : language });
    setShowModal(true);
  };

  const openEdit = (faq) => {
    setEditingId(faq._id);
    setForm({
      question: faq.question || '',
      answer: faq.answer || '',
      category: faq.category || 'general',
      language: faq.language || 'fr',
      order: faq.order ?? 0,
      isActive: faq.isActive !== false,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/api/faq/${editingId}`, form);
        toast.success(t('admin.faq.update_success', 'FAQ mise à jour'));
      } else {
        await api.post('/api/faq', form);
        toast.success(t('admin.faq.create_success', 'FAQ créée'));
      }
      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchFaqs();
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.faq.save_error', 'Échec de l’enregistrement'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (faq) => {
    try {
      await api.put(`/api/faq/${faq._id}`, {
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        language: faq.language,
        order: faq.order,
        isActive: !faq.isActive,
      });
      toast.success(
        faq.isActive
          ? t('admin.faq.deactivated', 'FAQ désactivée')
          : t('admin.faq.activated', 'FAQ activée')
      );
      fetchFaqs();
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.faq.save_error', 'Échec'));
    }
  };

  const handleSeed = async () => {
    const ok = await askConfirm(t('admin.faq.seed_confirm'), {
      confirmLabel: t('common.confirm', 'OK'),
      cancelLabel: t('common.cancel', 'Annuler'),
    });
    if (!ok) return;
    try {
      setSeeding(true);
      const { data } = await api.post('/api/faq/admin/initialize');
      toast.success(
        t('admin.faq.seed_success', {
          created: data.created ?? 0,
          skipped: data.skipped ?? 0,
        })
      );
      fetchFaqs();
    } catch (err) {
      logger.error('FAQ seed failed:', err);
      toast.error(err.response?.data?.message || t('admin.faq.seed_error'));
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
      toast.success(t('admin.faq.delete_success'));
      fetchFaqs();
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.faq.delete_error'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="text-primary-600" />
            {t('admin.faq.title')}
          </h1>
          <p className="text-muted mt-1">{t('admin.faq.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="btn-secondary disabled:opacity-60"
          >
            <RefreshCw size={18} className={seeding ? 'animate-spin' : ''} />
            {t('admin.faq.seed_button')}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="btn-primary"
          >
            <Plus size={18} />
            {t('admin.faq.create_button', 'Créer une FAQ')}
          </button>
        </div>
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
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(faq)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
                >
                  <Edit size={16} />
                  {t('admin.common.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleActive(faq)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  <Power size={16} />
                  {faq.isActive
                    ? t('admin.common.deactivate')
                    : t('admin.faq.activate', 'Activer')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(faq._id)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-700 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  {t('common.delete', 'Supprimer')}
                </button>
              </div>
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

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingId
                ? t('admin.faq.edit_title', 'Modifier la FAQ')
                : t('admin.faq.create_title', 'Nouvelle FAQ')}
            </h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">{t('admin.faq.question', 'Question')}</label>
                <input
                  required
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">{t('admin.faq.answer', 'Réponse')}</label>
                <textarea
                  required
                  rows={5}
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('admin.faq.category', 'Catégorie')}</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('admin.faq.language', 'Langue')}</label>
                  <select
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {['fr', 'en', 'es', 'ar'].map((l) => (
                      <option key={l} value={l}>
                        {l.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('admin.faq.order', 'Ordre')}</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <label className="flex items-center gap-2 mt-6 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  {t('admin.faq.active_label', 'Active')}
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {saving ? t('admin.common.saving', '…') : t('admin.common.save', 'Enregistrer')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg font-semibold"
                >
                  {t('admin.common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFaqPage;
