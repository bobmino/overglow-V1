import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Calendar, Palette, Utensils, Music, MapPin, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ScrollToTopButton from '../components/ScrollToTopButton';
import api from '../config/axios';
import { logger } from '../utils/logger.js';

const SECTION_META = [
  { id: 'traditions', labelKey: 'culture.section_traditions', icon: BookOpen },
  { id: 'festivals', labelKey: 'culture.section_festivals', icon: Calendar },
  { id: 'crafts', labelKey: 'culture.section_crafts', icon: Palette },
  { id: 'cuisine', labelKey: 'culture.section_cuisine', icon: Utensils },
  { id: 'music', labelKey: 'culture.section_music', icon: Music },
  { id: 'regions', labelKey: 'culture.section_regions', icon: MapPin },
];

const CulturePage = () => {
  const { t, i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState('traditions');
  const [sectionsData, setSectionsData] = useState({});
  const [authenticityTags, setAuthenticityTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/api/content/culture');
        if (!cancelled) {
          setSectionsData(data?.sections || {});
          setAuthenticityTags(data?.authenticityTags || []);
        }
      } catch (err) {
        logger.error('Culture content load failed:', err);
        if (!cancelled) {
          setSectionsData({});
          setAuthenticityTags([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  const sections = useMemo(
    () =>
      SECTION_META.map((meta) => ({
        ...meta,
        data: sectionsData[meta.id] || [],
      })),
    [sectionsData]
  );

  const activeData = sections.find((s) => s.id === activeSection)?.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('culture.hero_title')}</h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">{t('culture.hero_subtitle')}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="py-20 text-center text-gray-500">{t('common.loading')}</div>
        ) : (
          <>
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles size={24} className="text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">{t('culture.tags_title')}</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {authenticityTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="bg-white rounded-xl p-4 border border-gray-200 hover:border-primary-300 hover:shadow-md transition text-center"
                  >
                    <div className="text-3xl mb-2">{tag.icon}</div>
                    <h3 className="font-bold text-gray-900 mb-1">{tag.label}</h3>
                    <p className="text-xs text-gray-600">{tag.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8 overflow-x-auto">
              <div className="flex gap-2 border-b border-gray-200">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center gap-2 px-6 py-3 font-semibold transition whitespace-nowrap ${
                        activeSection === section.id
                          ? 'text-primary-600 border-b-2 border-primary-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={20} />
                      {t(section.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeData.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition"
                >
                  <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-white text-4xl">🏛️</div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 mb-4">{item.description}</p>
                    {item.dates && (
                      <p className="text-sm text-primary-600 font-semibold mb-3">📅 {item.dates}</p>
                    )}
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {item.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-primary-50 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('culture.cta_title')}</h2>
              <p className="text-gray-700 mb-6 max-w-2xl mx-auto">{t('culture.cta_text')}</p>
              <Link
                to="/search"
                className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-700 transition"
              >
                {t('culture.cta_button')}
              </Link>
            </div>
          </>
        )}
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default CulturePage;
