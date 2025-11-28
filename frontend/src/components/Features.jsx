import React from 'react';
import { Headset, Award, Star, Calendar } from 'lucide-react';

const FeatureItem = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center text-center p-4">
    <div className="mb-4 p-3 bg-green-50 rounded-full">
      <Icon size={32} className="text-green-700" strokeWidth={1.5} />
    </div>
    <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600 leading-relaxed max-w-xs">{description}</p>
  </div>
);

const Features = () => {
  const features = [
    {
      icon: Headset,
      title: "24/7 customer support",
      description: "No matter the time zone, we're here to help."
    },
    {
      icon: Award,
      title: "Earn rewards",
      description: "Explore, earn, redeem, and repeat with our loyalty program."
    },
    {
      icon: Star,
      title: "Millions of reviews",
      description: "Plan and book with confidence using reviews from fellow travelers."
    },
    {
      icon: Calendar,
      title: "Plan your way",
      description: "Stay flexible with free cancellation and the option to reserve now and pay later."
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Why book with Overglow-Trip?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureItem key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
