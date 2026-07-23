import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Remonte automatiquement en haut à chaque navigation (SPA).
 * Couvre window + conteneurs scrollables fréquents (shell admin/opérateur, mobile).
 */
const ScrollToTopOnNavigate = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollTop = () => {
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;

      document.querySelectorAll('[data-scroll-reset], main, [data-dashboard-scroll]').forEach((el) => {
        if (el instanceof HTMLElement && el.scrollHeight > el.clientHeight) {
          el.scrollTop = 0;
        }
      });
    };

    scrollTop();
    // Contenu lazy : second passage après paint
    const raf = window.requestAnimationFrame(scrollTop);
    const t = window.setTimeout(scrollTop, 50);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [pathname]);

  return null;
};

export default ScrollToTopOnNavigate;
