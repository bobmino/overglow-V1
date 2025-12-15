import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initGA4, trackPageView } from '../utils/analytics';

/**
 * Hook to automatically track page views
 * Should be used in the main App component
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize GA4 on mount
    initGA4();
  }, []);

  useEffect(() => {
    // Track page view on route change
    const path = location.pathname + location.search;
    const title = document.title || 'Overglow Trip';
    trackPageView(path, title);
  }, [location]);
};

