// Trivia Valle Viejo — Service Worker
// Cambiá el número de versión cada vez que actualices los archivos
const CACHE_NAME = 'trivia-vv-v4';

const ASSETS = [
  './',
  './index.html',
  './trivia.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './fondotrivia.webp',
  './condor.webp',
  './condorinicio.webp',
  './titulovertical2.png',
  './trivia.png',
  './susana.png',
  './valleviejofooter.png',
  './valleviejoredes.png',
];

// Instalar: cachear todos los assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activar: eliminar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first para assets locales, pass-through para el webhook de stats
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // No interceptar requests al webhook de Google (stats) ni a Google Fonts/CDNs
  if (
    url.includes('script.google.com') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com') ||
    url.includes('cdn.jsdelivr.net') ||
    url.includes('cdnjs.cloudflare.com')
  ) {
    return; // dejar que el browser lo maneje normalmente
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // No está en cache: intentar red y cachear la respuesta
      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const toCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
          return response;
        })
        .catch(() => {
          // Sin red y sin cache: devolver index.html como fallback para navegación
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
