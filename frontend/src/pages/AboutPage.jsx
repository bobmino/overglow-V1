import React, { useEffect, useState } from 'react';
import { Globe, Users, Heart, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/axios';

const AboutPage = () => {
  const { t, i18n } = useTranslation();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/api/content/about');
        if (!cancelled) setContent(data?.content || null);
      } catch (err) {
        console.error('About content load failed:', err);
        if (!cancelled) setContent(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  const c = content;

  return (
    <div className="page-shell">
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <Globe className="mx-auto h-20 w-20 mb-6" />
          <h1 className="text-5xl font-bold mb-6">
            {c?.heroTitle || t('about.hero_title')}
          </h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            {c?.heroSubtitle || t('about.hero_subtitle')}
          </p>
        </div>
      </section>

      {loading ? (
        <div className="py-20 text-center text-gray-500">{t('common.loading')}</div>
      ) : (
        <>
          <section className="py-20">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  {c?.missionTitle || t('about.mission_title')}
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  {c?.missionP1 || t('about.mission_p1')}
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {c?.missionP2 || t('about.mission_p2')}
                </p>
              </div>
            </div>
          </section>

          <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
                {c?.valuesTitle || t('about.values_title')}
              </h2>
              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {[
                  { icon: Heart, title: c?.valueAuthTitle, desc: c?.valueAuthDesc, tk: 'about.value_auth', dk: 'about.value_auth_desc' },
                  { icon: Users, title: c?.valueCommunityTitle, desc: c?.valueCommunityDesc, tk: 'about.value_community', dk: 'about.value_community_desc' },
                  { icon: Award, title: c?.valueExcellenceTitle, desc: c?.valueExcellenceDesc, tk: 'about.value_excellence', dk: 'about.value_excellence_desc' },
                ].map(({ icon: Icon, title, desc, tk, dk }) => (
                  <div key={tk} className="text-center">
                    <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Icon className="text-primary-600" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{title || t(tk)}</h3>
                    <p className="text-gray-600">{desc || t(dk)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-20 bg-primary-600 text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-6">{c?.ctaTitle || t('about.cta_title')}</h2>
              <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
                {c?.ctaText || t('about.cta_text')}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/register"
                  className="bg-white text-primary-600 px-8 py-3 rounded-lg font-bold hover:bg-primary-50 transition"
                >
                  {c?.ctaRegister || t('about.cta_register')}
                </Link>
                <Link
                  to="/partners/signup"
                  className="bg-primary-700 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-800 transition"
                >
                  {c?.ctaPartner || t('about.cta_partner')}
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AboutPage;
