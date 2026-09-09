// Minimal PWA Service Worker for Travelx Marketing App
const CACHE_NAME = 'travelx-pwa-v5';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Pass-through to network
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
