/**
 * Performance utilities for optimizing Core Web Vitals
 */

/**
 * Prefetch a route for faster navigation
 */
export const prefetchRoute = (path) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = path;
      document.head.appendChild(link);
    });
  }
};

/**
 * Preload an image for faster display
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Lazy load images with Intersection Observer
 */
export const setupLazyImages = () => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
};

/**
 * Defer non-critical scripts
 */
export const deferScript = (src) => {
  const script = document.createElement('script');
  script.src = src;
  script.defer = true;
  document.head.appendChild(script);
};

/**
 * Measure and report Core Web Vitals
 * Note: Function removed to avoid build errors
 * To enable: npm install web-vitals and create a new function
 */

/**
 * Optimize images with responsive srcset
 */
export const getResponsiveImageSrc = (baseSrc, sizes = [400, 800, 1200]) => {
  if (!baseSrc) return '';
  
  // If it's an external URL, return as is
  if (baseSrc.startsWith('http')) {
    return baseSrc;
  }
  
  // Generate srcset for different sizes
  const srcset = sizes.map(size => `${baseSrc}?w=${size} ${size}w`).join(', ');
  return srcset;
};

/**
 * Debounce function for performance optimization
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Request animation frame wrapper for smooth animations
 */
export const requestAnimationFrame = (callback) => {
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    return window.requestAnimationFrame(callback);
  }
  return setTimeout(callback, 16);
};

