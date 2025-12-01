import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Detect language based on browser, geolocation, or stored preference
const languageDetector = new LanguageDetector();
languageDetector.addDetector({
  name: 'geolocation',
  lookup: () => {
    // Try to detect based on timezone or other factors
    // For Morocco, we can check timezone or use browser language
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes('Casablanca') || timezone.includes('Rabat')) {
      return 'ar'; // Darija/Arabic for Morocco
    }
    return null;
  },
  cacheUserLanguage: () => {},
});

i18n
  .use(Backend)
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fr', // French as default for Morocco
    supportedLngs: ['fr', 'ar', 'en', 'es'],
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    detection: {
      order: ['localStorage', 'navigator', 'geolocation'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
