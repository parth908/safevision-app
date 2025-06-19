const CACHE_NAME = 'safevision-cache-v5'; // IMPORTANT: Incremented cache version again for a guaranteed fresh start
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // Consider caching important external CDN libraries for offline support if they are critical and stable, e.g.:
  // 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0',
  // 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd',
  // 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
  // However, caching external CDN resources explicitly can sometimes be tricky
  // and might require more advanced service worker strategies.
  // For now, these are the core app files that are served locally.
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing - v5. Taking control immediately.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Opened cache, adding core URLs.');
        return cache.addAll(urlsToCache);
      })
      // NEW: Force activation immediately after install
      .then(() => self.skipWaiting())
      .catch(err => console.error('[Service Worker] Cache addAll failed:', err))
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating - v5. Claiming clients.');
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
    // NEW: Take control of all open clients immediately
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // console.log(`[Service Worker] Serving from cache: ${event.request.url}`);
          return response;
        }
        // console.log(`[Service Worker] Fetching from network: ${event.request.url}`);
        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and can only be consumed once. We must consume it once to cache it
            // and once for the browser to receive it.
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
