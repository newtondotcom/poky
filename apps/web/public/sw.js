// Service Worker for Web Push Notifications

self.addEventListener('install', () => {
  self.skipWaiting();
  console.log('[ServiceWorker] Installed');
});

self.addEventListener('activate', () => {
  self.clients.claim();
  console.log('[ServiceWorker] Activated');
});

// Listen for push events
self.addEventListener('push', function(event) {
  console.log('[ServiceWorker] Push received:', event);
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('[ServiceWorker] Push event data is not JSON', e);
      data = { title: 'Notification', body: event.data.text() };
    }
  }

  const title = data.title || 'New Notification';
  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon-32x32.png',
    badge: data.badge || '/favicon-32x32.png',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[ServiceWorker] Notification click Received.', event);
  event.notification.close();
  // Focus or open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Optionally, listen for fetch events (for offline or update logic)
self.addEventListener('fetch', function(event) {
  // You can add custom fetch logic here if needed
  // For now, just pass through
  // console.log('[ServiceWorker] Fetch:', event.request.url);
});
