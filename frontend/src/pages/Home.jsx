import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import HeroSection from '../components/HeroSection';
import DynamicCarousel from '../components/DynamicCarousel';
import DestinationCard from '../components/DestinationCard';
import Features from '../components/Features';
import FlexibilityBanner from '../components/FlexibilityBanner';
import AuthCTA from '../components/AuthCTA';
import api from '../config/axios';
import { logger } from '../utils/logger.js';

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
};

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
          setLayout(data.layout);
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

  return (
    <div className="min-h-screen bg-white pb-24 flex flex-col gap-y-20 overflow-x-hidden">
      <HeroSection />
      <Features />

      {loading ? (
        <>
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

          {nationalGroups.map(
            (group) =>
              group.products?.length > 0 && (
                <div className="w-full" key={group._id}>
                  <DynamicCarousel title={group.name} items={group.products} categoryId={group._id} />
                </div>
              )
          )}

          <FlexibilityBanner />

          {internationalGroups.map(
            (group) =>
              group.products?.length > 0 && (
                <div className="w-full" key={group._id}>
                  <DynamicCarousel title={group.name} items={group.products} categoryId={group._id} />
                </div>
              )
          )}

          {insoliteGroups.map(
            (group) =>
              group.products?.length > 0 && (
                <div className="w-full" key={group._id}>
                  <DynamicCarousel title={group.name} items={group.products} categoryId={group._id} />
                </div>
              )
          )}

          {layout.topCircuits && layout.topCircuits.length > 0 && (
            <div className="w-full">
              <DynamicCarousel
                title={t('home.carousel_circuits')}
                items={layout.topCircuits}
                searchTag="Top Circuit"
              />
            </div>
          )}
        </>
      )}

      <AuthCTA />
    </div>
  );
};

export default Home;
