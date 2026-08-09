const CACHE_NAME = 'taskspin-v2';

const PRECACHE_ASSETS = [
  '/manifest.json',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  // Never cache Next.js internal requests (RSC, routing, data)
  if (
    request.url.includes('/_next/') ||
    request.url.includes('_rsc') ||
    request.headers.get('RSC') === '1' ||
    request.headers.get('Next-Router-State-Tree')
  ) {
    return;
  }

  // Page navigations: network-first, offline fallback only
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline') || new Response('Offline', { status: 503 }))
    );
    return;
  }

  // Static assets: cache-first
  if (
    request.url.includes('/favicon') ||
    request.url.includes('/android-chrome') ||
    request.url.includes('/apple-touch-icon') ||
    request.url.includes('/logo.png') ||
    request.url.includes('/manifest.json') ||
    request.url.match(/\.(png|jpg|jpeg|svg|ico|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Everything else: network-only (don't cache API responses or dynamic content)
});
