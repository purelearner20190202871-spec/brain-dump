const CACHE_NAME = 'brain-dump-shell-v1'
const SHELL_URLS = ['/', '/sign-in', '/icon-light-32x32.png', '/apple-icon.png', '/brain-dump-logo.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const requestUrl = new URL(event.request.url)
  if (requestUrl.origin !== self.location.origin) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && (event.request.mode === 'navigate' || requestUrl.pathname.startsWith('/_next/static/'))) {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
        }
        return response
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/'))),
  )
})
