const CACHE_NAME = 'spotify-clone-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple fetch passthrough to enable PWA installability
  event.respondWith(fetch(event.request));
});