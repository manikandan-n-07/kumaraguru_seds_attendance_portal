// sw.js - SEDS Attendance Portal Update Logic
const CACHE_NAME = 'seds-attendance-v1';

const FILES_TO_CACHE = [
  './', 
  './index.html',
  './style.css',
  './script.js',
  './src/img/SEDS3.png',
  './manifest.json'
];

// Install: Cache essential assets
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force the new service worker to become active immediately
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});


// Activate: Clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
});

// Fetch: Network-first strategy
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          if (e.request.method === "GET" && response.status === 200) {
            cache.put(e.request, responseClone);
          }
        });
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

// Listen for the "update" message from the frontend
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
