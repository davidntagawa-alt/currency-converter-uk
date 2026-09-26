// Service worker de Kobo — permet l'installation de l'app et un accès
// hors ligne à la page elle-même. Les taux de change restent gérés par
// l'application via localStorage (voir index.html), pas par ce fichier.

const CACHE_NAME = 'kobo-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stratégie : réseau d'abord (pour avoir la dernière version du site),
// et si hors ligne, on sert la version en cache.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // On ne touche jamais aux appels vers les API de taux de change :
  // ceux-ci sont déjà gérés et mis en cache par l'application elle-même.
  if (event.request.url.includes('open.er-api.com') || event.request.url.includes('frankfurter.app')) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
