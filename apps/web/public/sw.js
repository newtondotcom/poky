import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

// Nettoyage et precache
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Service Worker Installation
self.addEventListener("install", () => {
  self.skipWaiting();
  console.log("[ServiceWorker] Installed");
});

// Service Worker Activation
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
  console.log("[ServiceWorker] Activated");
});

// Push Notification Handling
self.addEventListener("push", function (event) {
  console.log("[ServiceWorker] Push received:", event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error("[ServiceWorker] Push event data is not JSON", e);
      data = { title: "Notification", body: event.data.text() };
    }
  }

  const title = data.title || "👋 New Poke!";
  const options = {
    body: data.body || "You received a new poke!",
    icon: data.icon || "/android-chrome-192x192",
    badge: data.badge || "/favicon-32x32.png",
    data: {
      ...data.data,
      url: data.url || "/",
      timestamp: Date.now()
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Handling
self.addEventListener("notificationclick", function (event) {
  console.log("[ServiceWorker] Notification click:", event);
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";
  
  event.waitUntil(
    self.clients.matchAll({type: 'window'}).then(clientList => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Push Subscription Change Handling
self.addEventListener("pushsubscriptionchange", async (event) => {
  console.log("[ServiceWorker] Push subscription change");

  event.waitUntil(
    (async () => {
      try {
        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: self.VAPID_PUBLIC_KEY
        });

        /*
        await fetch("/api/webpush/update", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            subscription: newSubscription,
            timestamp: Date.now()
          })
        });
        */

        // TODO : update the subscription in the database
        console.log(newSubscription);

        console.log("[ServiceWorker] Subscription updated");
      } catch (error) {
        console.error("[ServiceWorker] Failed to renew subscription:", error);
      }
    })()
  );
});

console.log("[ServiceWorker] Loaded");