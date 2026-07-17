self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// Mantém as informações sensíveis sempre vindas da rede e evita telas antigas em cache.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
