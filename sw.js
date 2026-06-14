// Simple service worker for cache busting
const CACHE_VERSION = 'v' + Date.now();
const CACHE_NAME = 'cloudcodetree-' + CACHE_VERSION;

// Clear old caches on activation
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith('cloudcodetree-'))
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

// Always fetch from network for HTML files
self.addEventListener('fetch', event => {
  if (event.request.url.endsWith('.html') || 
      event.request.url.includes('/') && !event.request.url.includes('.')) {
    // For HTML pages, always fetch from network
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match(event.request))
    );
  }
});