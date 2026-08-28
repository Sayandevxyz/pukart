// PUKart Push Notification Service Worker
self.addEventListener('push', function (event) {
  if (!event.data) return

  try {
    const data = event.data.json()

    const title = data.title || 'PUKart Notification'
    const options = {
      body: data.body || 'You have a new update on PuKart.',
      icon: data.icon || 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-EScoY3Dr9cDuwfPiUrfIsTl2QOCJT5.png',
      badge: data.badge || 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-EScoY3Dr9cDuwfPiUrfIsTl2QOCJT5.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: data.tag || 'pukart-notification',
      renotify: true,
      data: {
        url: data.url || '/',
      },
    }

    event.waitUntil(self.registration.showNotification(title, options))
  } catch (err) {
    console.error('[sw] Failed to parse push payload:', err)
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
