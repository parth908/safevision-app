const CACHE_NAME = 'safevision-cache-v1.0'; // Version your cache
const urlsToCache = [
  '/', // Caches index.html (the root path)
  '/index.html',
  '/manifest.json', // Cache the manifest file too!
  '/icon-192.png',  // Cache your icons
  '/icon-512.png',  // Cache your icons
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0',
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2'
  // Add any other static assets if they were external (e.g., separate CSS files)
];

// Install event: Cache essential assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching all app shell content');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Caching failed', error);
      })
  );
});

// Fetch event: Serve content from cache first, then fall back to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // No cache hit - fetch from network
        return fetch(event.request);
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName); // Delete old caches
          }
        })
      );
    })
  );
});