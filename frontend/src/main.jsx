import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async';
import './index.css'
import './i18n'; // Import i18n configuration
import App from './App.jsx'
import { CurrencyProvider } from './context/CurrencyContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import { setupLazyImages } from './utils/performance.js'
import { initSentry } from './utils/sentry.js'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { logger } from './utils/logger.js';
import { notify, askConfirm } from './utils/notify.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Initialize Sentry BEFORE everything else
initSentry();

// Soft-launch: replace blocking alert() with toast (ToastProvider listens for app-toast)
window.alert = (message) => {
  notify(message == null ? '' : String(message), 'info');
};

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // Log uniquement en développement
        if (import.meta.env.DEV) {
        logger.info('Service Worker registered:', registration.scope);
        }
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              askConfirm('Une nouvelle version est disponible. Voulez-vous recharger la page ?', {
                confirmLabel: 'OK',
                cancelLabel: 'Plus tard',
              }).then((ok) => {
                if (ok) window.location.reload();
              });
            }
          });
        });
      })
      .catch((error) => {
        // Log les erreurs même en production pour le débogage
        logger.error('Service Worker registration failed:', error);
      });
  });
  
  // Listen for install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    // Store the event for later use
    window.deferredInstallPrompt = e;
    // Show custom install button if needed
    const installButton = document.getElementById('install-pwa-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', async () => {
        e.prompt();
        const { outcome } = await e.userChoice;
        if (outcome === 'accepted' && import.meta.env.DEV) {
          logger.info('User accepted install prompt');
        }
        window.deferredInstallPrompt = null;
        installButton.style.display = 'none';
      });
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <CurrencyProvider>
            <CartProvider>
              <WishlistProvider>
                <App />
              </WishlistProvider>
            </CartProvider>
          </CurrencyProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)

// Setup performance optimizations after initial render
if (typeof window !== 'undefined') {
  // Setup lazy images
  setTimeout(() => {
    setupLazyImages();
  }, 1000);
  
  // Prefetch critical routes
  const criticalRoutes = ['/search', '/products'];
  criticalRoutes.forEach(route => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    }
  });
}
