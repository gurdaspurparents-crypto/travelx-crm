// Minimal PWA Service Worker for Travelx Marketing App
const CACHE_NAME = 'travelx-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through to network
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
