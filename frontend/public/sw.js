// Pawon Hara Service Worker for PWA & Background Push Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Listen for incoming Web Push events from Laravel backend (even when app is closed)
self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch (e) {
    try {
      payload = { body: event.data ? event.data.text() : 'Ada pesanan katering baru!' }
    } catch (_) {
      payload = { body: 'Ada pesanan katering baru!' }
    }
  }

  const title = payload.title || '🔔 Pesanan Baru Masuk - Pawon Hara'
  const options = {
    body: payload.body || 'Pesanan baru masuk dan siap diproses.',
    icon: payload.icon || '/favicon.webp',
    badge: payload.badge || '/favicon.webp',
    tag: payload.tag || 'new-order',
    renotify: true,
    requireInteraction: true, // Keep notification visible until user interacts
    vibrate: [250, 100, 250, 100, 400],
    data: {
      url: payload.url || '/admin/orders',
      orderId: payload.orderId || null,
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Buka Pesanan' },
      { action: 'dismiss', title: 'Tutup' },
    ],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Handle click on notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  const targetUrl = event.notification.data?.url || '/admin/orders'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If admin panel is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes('/admin') && 'focus' in client) {
          if ('navigate' in client && client.url !== targetUrl) {
            client.navigate(targetUrl)
          }
          return client.focus()
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
