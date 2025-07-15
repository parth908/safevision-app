const CACHE_NAME = 'safevision-cache-v3'; // Explicitly set to v3 as requested
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
  // Removed './call-112-screenshot.png' as it's not part of this version
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing - v3. Taking control immediately.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Opened cache, adding core URLs.');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[Service Worker] Cache addAll failed:', err))
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating - v3. Claiming clients.');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          function(response) {
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            var responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
  );
});
