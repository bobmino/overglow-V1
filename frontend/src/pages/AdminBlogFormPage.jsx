import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';
import { Save, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import DashboardNavBar from '../components/DashboardNavBar';

const CATEGORIES = [
  { value: 'Destinations', key: 'destinations' },
  { value: 'Conseils de voyage', key: 'travel_tips' },
  { value: 'Culture', key: 'culture' },
  { value: 'Gastronomie', key: 'gastronomy' },
  { value: 'Aventures', key: 'adventures' },
  { value: 'Actualités', key: 'news' },
  { value: 'Guides pratiques', key: 'practical_guides' },
];

const AdminBlogFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Destinations',
    tags: [],
    featuredImage: '',
    metaTitle: '',
    metaDescription: '',
    keywords: [],
    isPublished: true,
    featured: false,
  });

  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/blog/admin/all?limit=1000`);
      const post = data.posts?.find(p => p._id === id);

      if (post) {
        setFormData({
          title: post.title || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          category: post.category || 'Destinations',
          tags: post.tags || [],
          featuredImage: post.featuredImage || '',
          metaTitle: post.metaTitle || '',
          metaDescription: post.metaDescription || '',
          keywords: post.keywords || [],
          isPublished: post.isPublished || false,
          featured: post.featured || false,
        });
      } else {
        setError(t('admin.blog_form.post_not_found'));
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
      setError(t('admin.blog_form.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
    setSuccess('');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(t('admin.blog_form.image_required'));
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    setUploading(true);
    setError('');

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const { data } = await api.post('/api/upload', formDataUpload, config);
      const imageUrl = typeof data === 'string' ? data : (data.url || data);
      setFormData(prev => ({ ...prev, featuredImage: imageUrl }));
      setSuccess(t('admin.blog_form.image_upload_success'));
      setUploading(false);
    } catch (error) {
      console.error('Image upload error:', error);
      setError(t('admin.blog_form.image_upload_error'));
      setUploading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(keyword => keyword !== keywordToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.title.trim()) {
      setError(t('admin.blog_form.title_required'));
      setLoading(false);
      return;
    }

    if (!formData.excerpt.trim()) {
      setError(t('admin.blog_form.excerpt_required'));
      setLoading(false);
      return;
    }

    if (!formData.content.trim()) {
      setError(t('admin.blog_form.content_required'));
      setLoading(false);
      return;
    }

    try {
      const dataToSend = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: Array.isArray(formData.tags) ? formData.tags.filter(tag => tag && tag.trim()).map(tag => tag.trim()) : [],
        featuredImage: formData.featuredImage || '',
        metaTitle: formData.metaTitle?.trim() || '',
        metaDescription: formData.metaDescription?.trim() || '',
        keywords: Array.isArray(formData.keywords) ? formData.keywords.filter(kw => kw && kw.trim()).map(kw => kw.trim()) : [],
        isPublished: formData.isPublished || false,
        featured: formData.featured || false,
        publishedAt: formData.isPublished && !isEdit ? new Date() : formData.isPublished ? formData.publishedAt || new Date() : null,
      };

      if (isEdit) {
        await api.put(`/api/blog/${id}`, dataToSend);
        setSuccess(t('admin.blog_form.update_success'));
      } else {
        await api.post('/api/blog', dataToSend);
        setSuccess(t('admin.blog_form.create_success'));
      }

      setTimeout(() => {
        navigate('/admin/blog');
      }, 1500);
    } catch (error) {
      console.error('Failed to save post:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });

      let errorMessage = t('admin.blog_form.save_error');

      if (error.response?.data) {
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          const validationErrors = error.response.data.errors
            .map(err => err.msg || err.message)
            .join(', ');
          errorMessage = t('admin.blog_form.validation_errors', { errors: validationErrors });
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const wordCount = formData.content.split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.ceil(wordCount / 200) || 0;

  if (loading && isEdit) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? t('admin.blog_form.edit_title') : t('admin.blog_form.new_title')}
        </h1>
        <DashboardNavBar />
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle size={20} className="text-red-600 me-3 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle size={20} className="text-green-600 me-3 mt-0.5 flex-shrink-0" />
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-bold text-gray-700 mb-2">
              {t('admin.blog_form.title_label')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t('admin.blog_form.title_placeholder')}
              required
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('admin.common.characters', { count: formData.title.length, max: 200 })}
            </p>
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-sm font-bold text-gray-700 mb-2">
              {t('admin.blog_form.excerpt_label')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t('admin.blog_form.excerpt_placeholder')}
              required
              maxLength={300}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('admin.common.characters', { count: formData.excerpt.length, max: 300 })}
            </p>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-bold text-gray-700 mb-2">
              {t('admin.blog_form.content_label')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="15"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              placeholder={t('admin.blog_form.content_placeholder')}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('admin.common.words_reading', { words: wordCount, minutes: readingMinutes })}
            </p>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-bold text-gray-700 mb-2">
              {t('admin.blog_form.category_label')} <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {t(`admin.blog_form.categories.${cat.key}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('admin.blog_form.featured_image_label')}
            </label>
            {formData.featuredImage && (
              <div className="mb-4 relative inline-block">
                <img
                  src={formData.featuredImage}
                  alt="Featured"
                  className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, featuredImage: '' }))}
                  className="absolute top-2 end-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload size={24} className="text-gray-400 mb-2" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">{t('admin.blog_form.upload_click')}</span> {t('admin.blog_form.upload_drag')}
                </p>
                <p className="text-xs text-gray-500">{t('admin.blog_form.upload_formats')}</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>
            {uploading && (
              <p className="text-sm text-gray-500 mt-2">{t('admin.blog_form.uploading')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('admin.blog_form.tags_label')}
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={t('admin.blog_form.tag_placeholder')}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
              >
                {t('admin.common.add')}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-primary-900"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('admin.blog_form.seo_title')}</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="metaTitle" className="block text-sm font-bold text-gray-700 mb-2">
                  {t('admin.blog_form.meta_title_label')}
                </label>
                <input
                  type="text"
                  id="metaTitle"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={t('admin.blog_form.meta_title_placeholder')}
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.common.characters', { count: formData.metaTitle.length, max: 60 })}
                </p>
              </div>

              <div>
                <label htmlFor="metaDescription" className="block text-sm font-bold text-gray-700 mb-2">
                  {t('admin.blog_form.meta_description_label')}
                </label>
                <textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={t('admin.blog_form.meta_description_placeholder')}
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.common.characters', { count: formData.metaDescription.length, max: 160 })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {t('admin.blog_form.seo_keywords_label')}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={t('admin.blog_form.keyword_placeholder')}
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
                  >
                    {t('admin.common.add')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center gap-2"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="hover:text-gray-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('admin.blog_form.options_title')}</h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-semibold text-gray-700">{t('admin.blog_form.publish_now')}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-semibold text-gray-700">{t('admin.blog_form.featured_article')}</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {loading ? t('admin.common.saving') : isEdit ? t('admin.common.update') : t('admin.blog_form.create_article')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/blog')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              {t('admin.common.cancel')}
            </button>
          </div>
        </div>
      </form>

      <ScrollToTopButton />
    </div>
  );
};

export default AdminBlogFormPage;
