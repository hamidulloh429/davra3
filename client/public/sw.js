/* ============================================
   DAVRA v2.0 — Service Worker (NetworkFirst & Auto-Update)
   ============================================ */

const CACHE_NAME = 'davra-v2-cache-v2';

// 1. Force new Service Worker to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Clear old caches on activation and claim all open clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. NetworkFirst Strategy: Always fetch latest from network first
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If network returns clean response, update cache in background
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache only if offline / network fails
        return caches.match(event.request);
      })
  );
});
