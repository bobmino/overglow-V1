// Service Worker for Overglow PWA
const CACHE_NAME = 'overglow-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache install failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // If both cache and network fail, return offline page if available
        return caches.match('/index.html');
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Overglow';
  const options = {
    body: data.message || 'Vous avez une nouvelle notification',
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: data.type || 'notification',
    requireInteraction: false,
    data: data.relatedEntity || {},
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
  let url = '/';

  // Navigate based on notification type
  if (data && data.type) {
    switch (data.type) {
      case 'Booking':
        url = '/dashboard';
        break;
      case 'Product':
        url = data.id ? `/products/${data.id}` : '/search';
        break;
      case 'Inquiry':
        url = '/dashboard';
        break;
      case 'Review':
        url = data.id ? `/products/${data.id}` : '/search';
        break;
      default:
        url = '/dashboard';
    }
  }

  event.waitUntil(
    clients.openWindow(url)
  );
});

