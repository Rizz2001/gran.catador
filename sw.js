const CACHE_NAME = 'grancatador-v22';
const urlsToCache = [
  './index.html',
  './assets/css/main.css',
  './assets/css/responsive.css',
  './js/utils.js',
  './js/state.js',
  './js/cart.js',
  './js/ui.js',
  './js/app.js',
  './logo.webp',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Poppins:wght@400;500;600&display=swap'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // ESTRATEGIA SEGURA: Para HTML, JS, TXT y CSV -> SIEMPRE buscar internet primero. Si no hay señal, usar el guardado.
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.js') || url.pathname.endsWith('.html') || url.pathname.endsWith('.txt') || url.pathname.endsWith('.csv')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  // Para fotos y diseño -> Stale-While-Revalidate: carga ultrarrápida desde caché, pero actualiza en segundo plano.
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.ok) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {}); // Ignorar errores de red en el background
      
      return cachedResponse || fetchPromise;
    })
  );
});
