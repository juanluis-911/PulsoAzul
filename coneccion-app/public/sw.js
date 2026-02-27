const CACHE_NAME = 'pulso-azul-v1'

// ── Install: tomar control inmediato ─────────────────────────────────────────
self.addEventListener('install', (e) => {
  // Activar el nuevo SW sin esperar a que se cierren las pestañas
  self.skipWaiting()
})

// ── Activate: limpiar caches viejos y tomar control de todos los clientes ────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      // Eliminar caches de versiones anteriores
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
      ),
      // Tomar control inmediato de todas las pestañas abiertas
      clients.claim(),
    ])
  )
})

// ── Fetch: estrategia network-first para páginas, cache para assets ──────────
self.addEventListener('fetch', (e) => {
  // Solo interceptar requests del mismo origen
  if (!e.request.url.startsWith(self.location.origin)) return
  // No interceptar requests de la API
  if (e.request.url.includes('/api/')) return

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cachear solo respuestas exitosas de assets estáticos
        if (response.ok && e.request.method === 'GET') {
          const url = new URL(e.request.url)
          const esAsset = url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)
          if (esAsset) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone))
          }
        }
        return response
      })
      .catch(() => {
        // Si no hay red, intentar desde cache
        return caches.match(e.request)
      })
  )
})

// ── Push: mostrar notificación ────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  let data = {}
  try {
    data = e.data?.json() ?? {}
  } catch {
    data = { title: 'Pulso Azul', body: e.data?.text() || 'Nueva notificación' }
  }

  const options = {
    body:    data.body    || 'Tienes una nueva actualización',
    icon:    data.icon    || '/icon-192x192.png',
    badge:   data.badge   || '/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag:     data.tag     || 'pulso-azul-notif',
    renotify: true,
    requireInteraction: true,  // ← agrega esto
    data: { url: data.url || '/' },
  }

    e.waitUntil(
      self.registration.showNotification(data.title || 'Pulso Azul', options)
    )
  })

// ── Notification click: navegar a la URL correcta ────────────────────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || '/'

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      // Buscar si ya hay una ventana de la app abierta
      const win = wins.find(w => w.url.startsWith(self.location.origin))
      if (win) {
        // Navegar a la URL correcta y enfocar
        win.navigate(url)
        return win.focus()
      }
      // Si no hay ventana abierta, abrir una nueva
      return clients.openWindow(url)
    })
  )
})

// ── Push subscription change: renovar automáticamente si expira ──────────────
self.addEventListener('pushsubscriptionchange', (e) => {
  e.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: e.oldSubscription?.options?.applicationServerKey,
    }).then(newSub => {
      // Notificar a la app para que guarde la nueva suscripción en Supabase
      return fetch('/api/push-subscription-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldEndpoint: e.oldSubscription?.endpoint,
          newSubscription: newSub.toJSON(),
        }),
      })
    }).catch(err => console.error('Error renovando suscripción push:', err))
  )
})