const CACHE_NAME = 'safevision-cache-v6'; // This version ensures a fresh cache!
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // It's generally good practice to also cache critical CDN resources if they are stable.
  // For example, you could add:
  // 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0',
  // 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd',
  // 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
  // However, for this scenario, focusing on the local app files is usually sufficient for cache clearing.
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing - v6. Taking control immediately.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Opened cache, adding core URLs.');
        return cache.addAll(urlsToCache);
      })
      // self.skipWaiting() forces the new service worker to activate immediately,
      // without waiting for all active tabs controlled by the old service worker to close.
      .then(() => self.skipWaiting())
      .catch(err => console.error('[Service Worker] Cache addAll failed:', err))
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating - v6. Claiming clients.');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches that are not in the whitelist (i.e., older versions)
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
    // self.clients.claim() allows the active service worker to take control
    // of all clients (pages) within its scope, even if those clients were
    // loaded using a previous service worker.
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If the request is found in the cache, return the cached response
        if (response) {
          return response;
        }
        // If not in cache, fetch from the network
        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response from the network
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response; // Don't cache invalid responses
            }

            // IMPORTANT: Clone the response. A response is a stream and can only be consumed once.
            // We must clone it to consume it once for caching and once for the browser to receive it.
            var responseToCache = response.clone();

            // Open the current cache and put the new response into it
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response; // Return the original response to the browser
          }
        );
      })
  );
});
