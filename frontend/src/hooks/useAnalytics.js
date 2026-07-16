import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initGA4, trackPageView } from '../utils/analytics';

/**
 * Hook to automatically track page views (after cookie consent).
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    initGA4();
    const onPrefs = () => initGA4();
    window.addEventListener('overglow:cookie-prefs', onPrefs);
    return () => window.removeEventListener('overglow:cookie-prefs', onPrefs);
  }, []);

  useEffect(() => {
    const path = location.pathname + location.search;
    const title = document.title || 'Overglow Trip';
    trackPageView(path, title);
  }, [location]);
};
