const CACHE_VERSION = 'v2.0.1';
const STATIC_CACHE = `discipline-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `discipline-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `discipline-images-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/icon-192x192-maskable.png',
  '/icons/icon-512x512-maskable.png',
  '/icons/apple-touch-icon.png',
  '/robots.txt',
  '/sitemap.xml',
  '/OneSignalSDKWorker.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Some precache URLs failed:', err.message);
      })
    )
  );
  // Updates are applied silently; the UI no longer shows update prompts.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.endsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isNavigationRequest(request) {
  return request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  return /\.(?:js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|webp|gif|ico)$/i.test(url.pathname);
}

function isImageRequest(request) {
  const url = new URL(request.url);
  return /\.(?:png|jpg|jpeg|webp|gif|ico|svg)$/i.test(url.pathname) || request.destination === 'image';
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse?.ok) void cache.put(request, networkResponse.clone());
    return networkResponse;
  }).catch(() => cachedResponse);
  return cachedResponse || fetchPromise;
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) return cachedResponse;
  try {
    const networkResponse = await fetch(request);
    if (networkResponse?.ok) void cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch {
    return Response.error();
  }
}

async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse?.ok) {
      const cache = await caches.open(STATIC_CACHE);
      void cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cache = await caches.open(STATIC_CACHE);
    return (await cache.match(request)) || (await cache.match('/index.html')) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }
  if (isImageRequest(request)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }
  if (isStaticAsset(request)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
