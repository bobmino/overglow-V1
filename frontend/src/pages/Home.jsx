import React, { useState, useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import DynamicCarousel from '../components/DynamicCarousel';
import DestinationCard from '../components/DestinationCard';
import ProductCard from '../components/ProductCard';
import api from '../config/axios';

const CarouselSkeleton = () => (
  <div className="w-full px-4 md:px-8 mb-16 animate-pulse">
    <div className="h-8 bg-slate-200 rounded w-48 mb-8"></div>
    <div className="flex gap-6 overflow-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="min-w-[280px] md:min-w-[320px] h-[400px] bg-slate-200 rounded-2xl flex-none"></div>
      ))}
    </div>
  </div>
);

const Home = () => {
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const { data } = await api.get('/api/homepage/layout');
        if (data.success) {
          setLayout(data.layout);
        }
      } catch (error) {
        console.error('Failed to fetch homepage layout:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLayout();
  }, []);

  if (loading || !layout) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="h-[80vh] min-h-[600px] bg-slate-200 animate-pulse mb-16"></div>
        <CarouselSkeleton />
        <CarouselSkeleton />
        <CarouselSkeleton />
      </div>
    );
  }

  // Extract the first active national and international groups if they exist
  const exploreMaroc = layout.offers?.national?.[0];
  const evasionIntl = layout.offers?.international?.[0];

  return (
    <div className="min-h-screen bg-white pb-20 flex flex-col gap-y-16">
      <HeroSection />

      {/* Top Destinations */}
      {layout.topDestinations && layout.topDestinations.length > 0 && (
        <DynamicCarousel
          title="Top Destinations"
          items={layout.topDestinations}
          renderCard={(dest) => (
            <DestinationCard
              name={dest.city}
              image={dest.image}
              toursCount={dest.bookingCount}
            />
          )}
        />
      )}

      {/* Explorez le Maroc (National) */}
      {exploreMaroc && exploreMaroc.products?.length > 0 && (
        <DynamicCarousel
          title={exploreMaroc.name}
          items={exploreMaroc.products}
          categoryId={exploreMaroc._id}
        />
      )}

      {/* Évasions Internationales */}
      {evasionIntl && evasionIntl.products?.length > 0 && (
        <DynamicCarousel
          title={evasionIntl.name}
          items={evasionIntl.products}
          categoryId={evasionIntl._id}
        />
      )}

      {/* Expériences & Circuits */}
      {layout.topCircuits && layout.topCircuits.length > 0 && (
        <DynamicCarousel
          title="Expériences & Circuits"
          items={layout.topCircuits}
          searchTag="circuit"
        />
      )}
    </div>
  );
};

export default Home;
