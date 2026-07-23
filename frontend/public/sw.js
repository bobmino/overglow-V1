// Service Worker Overglow — soft-launch
// Network-first pour HTML/JS/CSS/API afin d'éviter les bundles et layouts périmés.
const CACHE_NAME = 'overglow-v1.2';
const PRECACHE = ['/manifest.json', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .catch((error) => console.error('Cache install failed:', error))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  return self.clients.claim();
});

const isApiRequest = (url) => url.pathname.startsWith('/api/');
const isHtmlNavigation = (request, url) =>
  request.mode === 'navigate' ||
  url.pathname === '/' ||
  url.pathname.endsWith('.html') ||
  url.pathname.match(/^\/(fr|en|es|ar)(\/|$)/);

const isVersionedAsset = (url) =>
  url.pathname.startsWith('/assets/') ||
  url.pathname.endsWith('.js') ||
  url.pathname.endsWith('.css');

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = new URL(event.request.url);

  // API + HTML + bundles versionnés : toujours réseau d'abord (pas de layout/JS fantôme)
  if (isApiRequest(url) || isHtmlNavigation(event.request, url) || isVersionedAsset(url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match(event.request).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  // Images / static : cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Overglow';
  const options = {
    body: data.message || 'Vous avez une nouvelle notification',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: data.type || 'notification',
    requireInteraction: false,
    data: data.relatedEntity || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data;
  let url = '/';
  if (data && data.type) {
    switch (data.type) {
      case 'Booking':
      case 'Inquiry':
        url = '/dashboard';
        break;
      case 'Product':
      case 'Review':
        url = data.id ? `/products/${data.id}` : '/search';
        break;
      default:
        url = '/dashboard';
    }
  }
  event.waitUntil(clients.openWindow(url));
});
