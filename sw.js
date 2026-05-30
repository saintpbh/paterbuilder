const CACHE_NAME = 'pattern-builder-v2.1';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './css/question.css',
  './css/chili.css',
  './js/main.js',
  './js/audio.js',
  './js/config.js',
  './js/state.js',
  './js/storage.js',
  './js/utils.js',
  './js/analytics.js',
  './js/structure_game/game.js',
  './js/structure_game/ui.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
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

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        if (e.request.url.startsWith(self.location.origin) && e.request.method === 'GET') {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      }).catch(() => {
        // Silent catch offline
      });
    })
  );
});
