import React from 'react';
import LocalizedLink from '../components/LocalizedLink';
import { Search, CalendarCheck, CreditCard, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HowItWorksPage = () => {
  const { t } = useTranslation();

  const steps = [
    { icon: Search, titleKey: 'how_it_works.step1_title', textKey: 'how_it_works.step1_text' },
    { icon: CalendarCheck, titleKey: 'how_it_works.step2_title', textKey: 'how_it_works.step2_text' },
    { icon: CreditCard, titleKey: 'how_it_works.step3_title', textKey: 'how_it_works.step3_text' },
    { icon: Compass, titleKey: 'how_it_works.step4_title', textKey: 'how_it_works.step4_text' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
            {t('how_it_works.title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('how_it_works.subtitle')}</p>
        </div>

        <div className="space-y-8 mb-14">
          {steps.map(({ icon, titleKey, textKey }, index) => {
            const Icon = icon;
            return (
            <div
              key={titleKey}
              className="flex gap-6 items-start bg-white border border-primary-100 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="text-primary-600" size={22} />
                  <h2 className="text-xl font-bold text-gray-900">{t(titleKey)}</h2>
                </div>
                <p className="text-gray-600 leading-relaxed">{t(textKey)}</p>
              </div>
            </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <LocalizedLink
            to="/search"
            className="inline-flex justify-center px-8 py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700"
          >
            {t('how_it_works.cta_explore')}
          </LocalizedLink>
          <LocalizedLink
            to="/partners/signup"
            className="inline-flex justify-center px-8 py-3 rounded-lg border border-primary-600 text-primary-700 font-semibold hover:bg-primary-50"
          >
            {t('how_it_works.cta_partner')}
          </LocalizedLink>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
