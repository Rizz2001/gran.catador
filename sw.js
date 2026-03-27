const CACHE_NAME = 'grancatador-v7';
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './logo.png',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Instalación del Service Worker y Cacheo inicial
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Limpieza de Caches viejos al actualizar
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia de Red: Network First para archivos de texto/csv, Cache First para lo visual
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Si busca los archivos de inventario o control, intentar siempre internet primero
  if(url.pathname.endsWith('.txt') || url.pathname.endsWith('.csv')) {
      event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
      );
      return;
  }

  // Para el resto de cosas (imágenes, código), responder rápido con Cache si existe
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
