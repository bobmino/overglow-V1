import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { HelpCircle, ChevronDown, ChevronUp, Search, ThumbsUp, ThumbsDown } from 'lucide-react';
import { logger } from '../utils/logger.js';

const FAQSection = ({ category, language = 'fr', limit = 10 }) => {
  const { t } = useTranslation();
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(category || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, [language]);

  useEffect(() => {
    fetchFAQs();
  }, [selectedCategory, searchQuery, language]);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get(`/api/faq/categories?language=${language}`);
      setCategories(data);
    } catch (err) {
      logger.error('Failed to fetch FAQ categories:', err);
    }
  };

  const fetchFAQs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { language, limit };
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const { data } = await api.get('/api/faq', { params });
      setFaqs(data.faqs || []);
    } catch (err) {
      logger.error('Failed to fetch FAQs:', err);
      setError(t('faq_ui.load_error', 'Erreur lors du chargement des questions fréquentes'));
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (faqId, helpful) => {
    try {
      await api.post(`/api/faq/${faqId}/feedback`, { helpful });
    } catch (err) {
      logger.error('Failed to submit feedback:', err);
    }
  };

  const toggleFAQ = (faqId) => {
    setExpandedId(expandedId === faqId ? null : faqId);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('faq_ui.search_placeholder', 'Rechercher dans la FAQ...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-10 pe-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            aria-label={t('faq_ui.search_placeholder', 'Rechercher dans la FAQ...')}
          />
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl font-semibold transition ${
                selectedCategory === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              aria-label={t('faq_ui.all_categories', 'Toutes les catégories')}
            >
              {t('faq_ui.all', 'Toutes')}
            </button>
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-xl font-semibold transition ${
                  selectedCategory === cat.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                aria-label={`${t('faq_ui.category', 'Catégorie')} ${cat.label}`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">{t('faq_ui.loading', 'Chargement des questions...')}</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-12">
          <HelpCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-600">{t('faq_ui.empty', 'Aucune question trouvée')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq._id}
              className="surface-card overflow-hidden transition-shadow hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => toggleFAQ(faq._id)}
                className="w-full px-6 py-4 flex items-center justify-between text-start focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
                aria-expanded={expandedId === faq._id}
                aria-controls={`faq-answer-${faq._id}`}
              >
                <span className="font-semibold text-gray-900 pe-4">{faq.question}</span>
                {expandedId === faq._id ? (
                  <ChevronUp className="text-primary-600 flex-shrink-0" size={20} />
                ) : (
                  <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
                )}
              </button>

              {expandedId === faq._id && (
                <div
                  id={`faq-answer-${faq._id}`}
                  className="px-6 py-4 border-t border-border bg-slate-50"
                >
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-line">{faq.answer}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-4 pt-4 border-t border-border">
                    <span className="text-sm text-gray-600">
                      {t('faq_ui.helpful_prompt', 'Cette réponse vous a-t-elle été utile ?')}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleFeedback(faq._id, true)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-primary-600 transition rounded-lg hover:bg-primary-50"
                        aria-label={t('faq_ui.helpful', 'Utile')}
                      >
                        <ThumbsUp size={16} />
                        <span>{faq.helpful || 0}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFeedback(faq._id, false)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-red-600 transition rounded-lg hover:bg-red-50"
                        aria-label={t('faq_ui.not_helpful', 'Pas utile')}
                      >
                        <ThumbsDown size={16} />
                        <span>{faq.notHelpful || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FAQSection;
