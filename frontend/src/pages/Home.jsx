import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Sparkles } from 'lucide-react';
import HeroSection from '../components/HeroSection';
import DynamicCarousel from '../components/DynamicCarousel';
import DestinationCard from '../components/DestinationCard';
import Features from '../components/Features';
import FlexibilityBanner from '../components/FlexibilityBanner';
import AuthCTA from '../components/AuthCTA';
import SEOHead from '../components/SEOHead';
import LocalizedLink from '../components/LocalizedLink';
import api from '../config/axios';
import { logger } from '../utils/logger.js';
import { CURATED_EXTRAS } from '../data/storeCatalog';

const CarouselSkeleton = () => (
  <div className="w-full px-4 md:px-8 mb-16 animate-pulse">
    <div className="h-8 bg-slate-200 rounded-lg w-56 mb-8" />
    <div className="flex gap-6 overflow-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="min-w-[280px] md:min-w-[320px] h-[400px] bg-slate-100 rounded-2xl flex-none border border-slate-200/50"
        />
      ))}
    </div>
  </div>
);

const EMPTY_LAYOUT = {
  topDestinations: [],
  offers: { national: [], international: [], insolite: [] },
  topCircuits: [],
  topServices: [],
  topProducts: [],
  exploreTours: [],
  luxuryStays: [],
  premiumServices: [],
};

const StoreCta = ({ to, label }) => (
  <div className="px-4 md:px-8 -mt-4 mb-8">
    <LocalizedLink
      to={to}
      className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800"
    >
      {label}
      <ArrowRight size={16} />
    </LocalizedLink>
  </div>
);

const Home = () => {
  const { t, i18n } = useTranslation();
  const [layout, setLayout] = useState(EMPTY_LAYOUT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchLayout = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/api/homepage/layout');
        if (!cancelled && data?.layout) {
          setLayout({ ...EMPTY_LAYOUT, ...data.layout });
        }
      } catch (error) {
        logger.error('Failed to fetch homepage layout:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLayout();
    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  const nationalGroups = layout.offers?.national || [];
  const internationalGroups = layout.offers?.international || [];
  const insoliteGroups = layout.offers?.insolite || [];
  const exploreItems =
    layout.exploreTours?.length > 0 ? layout.exploreTours : layout.topCircuits || [];
  const staysItems = layout.luxuryStays || [];
  const extrasItems =
    layout.premiumServices?.length > 0
      ? layout.premiumServices
      : layout.topServices || [];

  return (
    <div className="min-h-screen bg-white flex flex-col gap-y-16 overflow-x-hidden">
      <SEOHead
        title={t('home.meta_title', 'Expériences authentiques au Maroc')}
        description={t(
          'home.meta_description',
          'Réservez des tours, séjours et extras locaux au Maroc — paiement sécurisé, hôtes vérifiés.'
        )}
        pathname="/"
      />
      <HeroSection />
      <Features />

      {loading ? (
        <>
          <CarouselSkeleton />
          <CarouselSkeleton />
          <CarouselSkeleton />
        </>
      ) : (
        <>
          {layout.topDestinations && layout.topDestinations.length > 0 && (
            <div className="w-full">
              <DynamicCarousel
                title={t('home.carousel_destinations')}
                items={layout.topDestinations}
                seeMoreTo="/explore"
                renderCard={(dest) => (
                  <DestinationCard
                    name={dest.city}
                    image={dest.image}
                    toursCount={dest.bookingCount}
                  />
                )}
              />
            </div>
          )}

          {/* Pillar 1 — Explorer */}
          {exploreItems.length > 0 && (
            <div className="w-full">
              <DynamicCarousel
                title={t('home.section_explore')}
                items={exploreItems}
                seeMoreTo="/explore"
              />
              <StoreCta to="/explore" label={t('home.cta_explore')} />
            </div>
          )}

          {nationalGroups.map(
            (group) =>
              group.products?.length > 0 && (
                <div className="w-full" key={group._id}>
                  <DynamicCarousel
                    title={group.name}
                    items={group.products}
                    categoryId={group._id}
                    seeMoreTo="/explore"
                  />
                </div>
              )
          )}

          <FlexibilityBanner />

          {/* Pillar 2 — Logements */}
          <div className="w-full">
            {staysItems.length > 0 ? (
              <>
                <DynamicCarousel
                  title={t('home.section_stays')}
                  items={staysItems}
                  seeMoreTo="/stays"
                />
                <StoreCta to="/stays" label={t('home.cta_stays')} />
              </>
            ) : (
              <section className="px-4 md:px-8">
                <h2 className="text-3xl font-heading font-extrabold text-slate-900 mb-2">
                  {t('home.section_stays')}
                </h2>
                <p className="text-slate-600 mb-6 max-w-2xl">{t('stores.stays.subtitle')}</p>
                <LocalizedLink
                  to="/stays"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800"
                >
                  {t('home.cta_stays')}
                  <ArrowRight size={16} />
                </LocalizedLink>
              </section>
            )}
          </div>

          {internationalGroups.map(
            (group) =>
              group.products?.length > 0 && (
                <div className="w-full" key={group._id}>
                  <DynamicCarousel
                    title={group.name}
                    items={group.products}
                    categoryId={group._id}
                    seeMoreTo="/explore"
                  />
                </div>
              )
          )}

          {/* Pillar 3 — Extras */}
          <div className="w-full">
            {extrasItems.length > 0 ? (
              <>
                <DynamicCarousel
                  title={t('home.section_extras')}
                  items={extrasItems}
                  seeMoreTo="/extras"
                />
                <StoreCta to="/extras" label={t('home.cta_extras')} />
              </>
            ) : (
              <section className="px-4 md:px-8">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="text-amber-500" size={22} />
                  <h2 className="text-3xl font-heading font-extrabold text-slate-900">
                    {t('home.section_extras')}
                  </h2>
                </div>
                <p className="text-slate-600 mb-6 max-w-2xl">{t('stores.extras.subtitle')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {CURATED_EXTRAS.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <span className="text-[10px] font-bold uppercase text-amber-700">
                        {t('stores.badge_soon')}
                      </span>
                      <p className="font-semibold text-slate-900 mt-2">{t(item.titleKey)}</p>
                      <p className="text-xs text-slate-500 mt-1">{t(item.cityKey)}</p>
                    </div>
                  ))}
                </div>
                <LocalizedLink
                  to="/extras"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700"
                >
                  {t('home.cta_extras')}
                  <ArrowRight size={16} />
                </LocalizedLink>
              </section>
            )}
          </div>

          {insoliteGroups.map(
            (group) =>
              group.products?.length > 0 && (
                <div className="w-full" key={group._id}>
                  <DynamicCarousel
                    title={group.name}
                    items={group.products}
                    categoryId={group._id}
                    seeMoreTo="/explore"
                  />
                </div>
              )
          )}

          {/* Cross-sell CTAs */}
          <section className="px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <LocalizedLink
              to="/explore"
              className="rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-700 text-white p-6 hover:shadow-lg transition"
            >
              <p className="text-sm text-emerald-100 mb-1">{t('home.cross_after_stay')}</p>
              <span className="inline-flex items-center gap-2 font-bold">
                {t('home.cta_explore')}
                <ArrowRight size={16} />
              </span>
            </LocalizedLink>
            <LocalizedLink
              to="/extras"
              className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 text-white p-6 hover:shadow-lg transition"
            >
              <p className="text-sm text-slate-300 mb-1">{t('home.cross_after_tour')}</p>
              <span className="inline-flex items-center gap-2 font-bold">
                {t('home.cta_extras')}
                <ArrowRight size={16} />
              </span>
            </LocalizedLink>
          </section>
        </>
      )}

      <AuthCTA />
    </div>
  );
};

export default Home;
