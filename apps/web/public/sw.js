import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

// Nettoyage et precache
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Installation et activation (votre code existant amélioré)
self.addEventListener("install", () => {
  self.skipWaiting();
  console.log("[ServiceWorker] Pok7 Installed");
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Nettoyer les anciens caches spécifiques à pok7
      caches
        .keys()
        .then((cacheNames) =>
          Promise.all(
            cacheNames
              .filter(
                (cacheName) =>
                  cacheName.startsWith("pok7-") && !cacheName.includes("v2"),
              )
              .map((cacheName) => caches.delete(cacheName)),
          ),
        ),
    ]),
  );
  console.log("[ServiceWorker] Pok7 Activated");
});

// === NOUVELLES STRATÉGIES DE CACHE ===

// Cache pour les API tRPC
registerRoute(
  ({ url }) => url.pathname.startsWith("/trpc/"),
  new NetworkFirst({
    cacheName: "pok7-trpc-cache",
    networkTimeoutSeconds: 5,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        },
        requestWillFetch: async ({ request }) => {
          const headers = new Headers(request.headers);
          headers.set("x-trpc-source", "pok7-sw");
          return new Request(request, { headers });
        },
      },
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes pour les données de pokes
      }),
    ],
  }),
);

// Cache pour le serveur Hono
registerRoute(
  ({ url }) =>
    url.origin.includes("localhost:3000") || url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "pok7-hono-api",
    networkTimeoutSeconds: 3,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        },
      },
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 2 * 60,
      }),
    ],
  }),
);

// Cache pour TanStack Router
registerRoute(
  ({ request, url }) => {
    return (
      request.mode === "navigate" ||
      request.destination === "document" ||
      url.pathname.includes("__data")
    );
  },
  new NetworkFirst({
    cacheName: "pok7-routes",
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 10 * 60,
      }),
    ],
  }),
);

// Cache pour les assets statiques (Tailwind, shadcn/ui, etc.)
registerRoute(
  ({ request }) =>
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font",
  new CacheFirst({
    cacheName: "pok7-static-assets",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours
      }),
    ],
  }),
);

// === GESTION DES PUSH NOTIFICATIONS ===

self.addEventListener("push", function (event) {
  console.log("[ServiceWorker] Pok7 Push received:", event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error("[ServiceWorker] Push event data is not JSON", e);
      data = { title: "Pok7 Notification", body: event.data.text() };
    }
  }

  // Configuration spécifique pour les pokes
  const title = data.title || "👋 New Poke!";
  const options = {
    body: data.body || "You received a new poke!",
    icon: data.icon || "/pwa-192x192.png",
    badge: data.badge || "/pwa-64x64.png",
    data: {
      ...data.data,
      timestamp: Date.now(),
      type: data.type || "poke",
    },
    actions: data.actions || [
      { action: "view", title: "👀 View" },
      { action: "poke-back", title: "👋 Poke Back" },
    ],
    requireInteraction: data.requireInteraction || true,
    vibrate: data.type === "poke" ? [200, 100, 200] : [100],
    tag: data.tag || `pok7-${data.type || "notification"}`,
    renotify: true,
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      // Sauvegarder la notification pour usage offline si nécessaire
      saveNotificationToCache(data),
    ]),
  );
});

// Gestion des clics sur notifications (votre code amélioré)
self.addEventListener("notificationclick", function (event) {
  console.log("[ServiceWorker] Pok7 Notification click:", event);

  event.notification.close();

  // Gestion des actions spécifiques aux pokes
  if (event.action) {
    switch (event.action) {
      case "view":
        event.waitUntil(openApp("/"));
        break;
      case "poke-back":
        const userId = event.notification.data?.userId;
        if (userId) {
          event.waitUntil(openApp(`/poke/${userId}`));
        } else {
          event.waitUntil(openApp("/"));
        }
        break;
      default:
        event.waitUntil(openApp("/"));
    }
  } else {
    // Clic simple sur la notification
    const targetUrl = event.notification.data?.url || "/";
    event.waitUntil(openApp(targetUrl));
  }
});

// Fonction helper pour ouvrir l'app
async function openApp(url = "/") {
  const clientList = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  // Chercher une fenêtre existante avec la bonne URL
  for (const client of clientList) {
    if (client.url.includes(url) && "focus" in client) {
      return client.focus();
    }
  }

  // Chercher n'importe quelle fenêtre de l'app
  for (const client of clientList) {
    if (client.url.includes(location.origin) && "focus" in client) {
      client.navigate(url);
      return client.focus();
    }
  }

  // Ouvrir une nouvelle fenêtre
  if (self.clients.openWindow) {
    return self.clients.openWindow(url);
  }
}

// Gestion du renouvellement d'abonnement
self.addEventListener("pushsubscriptionchange", async (event) => {
  console.log("[ServiceWorker] Push subscription change");

  event.waitUntil(
    (async () => {
      try {
        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: self.VAPID_PUBLIC_KEY,
        });

        // Envoyer la nouvelle subscription au backend
        await fetch("/api/webpush/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription: newSubscription,
            timestamp: Date.now(),
          }),
        });

        console.log("[ServiceWorker] Subscription updated:", newSubscription);
      } catch (error) {
        console.error("[ServiceWorker] Failed to renew subscription:", error);
      }
    })(),
  );
});

// === NOUVELLES FONCTIONNALITÉS ===

// Background Sync pour les pokes offline
self.addEventListener("sync", (event) => {
  if (event.tag === "pok7-sync-pokes") {
    event.waitUntil(syncOfflinePokes());
  }
});

async function syncOfflinePokes() {
  try {
    // Récupérer les pokes en attente depuis le cache
    const cache = await caches.open("pok7-offline-pokes");
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const pokeData = await response.json();

        // Envoyer via tRPC quand la connexion est rétablie
        await fetch("/api/trpc/poke.send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pokeData),
        });

        // Supprimer du cache offline
        await cache.delete(request);
      }
    }

    console.log("[ServiceWorker] Offline pokes synced");
  } catch (error) {
    console.error("[ServiceWorker] Sync failed:", error);
  }
}

// Sauvegarder les notifications pour usage offline
async function saveNotificationToCache(data) {
  try {
    const cache = await caches.open("pok7-notifications");
    const response = new Response(
      JSON.stringify({
        ...data,
        cached_at: Date.now(),
      }),
    );

    await cache.put(`/notification/${data.id || Date.now()}`, response);
  } catch (error) {
    console.error("[ServiceWorker] Failed to cache notification:", error);
  }
}

// Gestion améliorée des fetch (votre code existant + améliorations)
self.addEventListener("fetch", function (event) {
  const { request } = event;

  // Log pour debug (désactivé par défaut)
  // console.log('[ServiceWorker] Fetch:', request.url);

  // Gestion spéciale pour les requêtes de pokes offline
  if (request.url.includes("/api/trpc/poke.send") && !navigator.onLine) {
    event.respondWith(handleOfflinePoke(request));
    return;
  }

  // Fallback navigation pour SPA
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/index.html")));
  }
});

async function handleOfflinePoke(request) {
  try {
    const cache = await caches.open("pok7-offline-pokes");
    const pokeData = await request.json();

    // Sauvegarder pour sync plus tard
    await cache.put(
      request.url + "?" + Date.now(),
      new Response(
        JSON.stringify({
          ...pokeData,
          queued_at: Date.now(),
        }),
      ),
    );

    // Programmer la synchronisation
    await self.registration.sync.register("pok7-sync-pokes");

    // Retourner une réponse de succès temporaire
    return new Response(
      JSON.stringify({
        success: true,
        queued: true,
        message: "Poke queued for when you're back online!",
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to queue poke",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Messages entre SW et app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: "2.0.0" });
  }
});

console.log("[ServiceWorker] Pok7 Enhanced SW loaded");
