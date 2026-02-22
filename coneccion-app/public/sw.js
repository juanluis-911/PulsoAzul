self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'Conección', {
      body: data.body || 'Nuevo registro agregado',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then((wins) => {
      const url = e.notification.data?.url || '/'
      const win = wins.find((w) => w.focus)
      if (win) return win.focus()
      return clients.openWindow(url)
    })
  )
})