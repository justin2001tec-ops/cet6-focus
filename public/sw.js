const BASE_URL = new URL('./', self.location.href).pathname
const withBase = (path) => `${BASE_URL}${path.replace(/^\/+/, '')}`
const CACHE_NAME = 'cet6-focus-shell-v2'
const APP_SHELL = [withBase(''), withBase('index.html'), withBase('manifest.webmanifest'), withBase('icon.svg'), withBase('data/cet6-vocab.v1.json')]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) {
      const copy = response.clone()
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
    }
    return response
  })))
})
