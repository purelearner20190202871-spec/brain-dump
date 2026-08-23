const CACHE_NAME = 'brain-dump-v1'
const APP_SHELL = ['/', '/manifest.json', '/brain-dump-icon-192.png', '/brain-dump-icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))))
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) {
      const copy = response.clone()
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
    }
    return response
  }).catch(() => caches.match('/'))))
})

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'DAILY_TASK_REMINDER') return
  const count = Number(event.data.count) || 0
  if (count === 0) return
  event.waitUntil(self.registration.showNotification('Brain Dump', {
    body: `You have ${count} task${count === 1 ? '' : 's'} due today.`,
    icon: '/brain-dump-icon-192.png',
    badge: '/brain-dump-icon-192.png',
    tag: 'daily-task-reminder',
    data: { url: '/' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const client = clients.find((item) => 'focus' in item)
    return client ? client.focus() : self.clients.openWindow(event.notification.data?.url || '/')
  }))
})
