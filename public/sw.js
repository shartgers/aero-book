const CACHE_NAME = "aerobook-v2";
// Only cache paths that are safe to show offline (avoid caching "/" so first load is always fresh).
const STATIC_ASSETS = ["/aircraft", "/bookings", "/bills"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API: network-only, fall back to 503 when offline
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request).catch(() => new Response("Offline", { status: 503 })));
    return;
  }

  // Navigation / document requests: always try network first so the app never shows stale HTML.
  // Fixes "first load shows old/minimal page until manual refresh".
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((res) => res)
        .catch(() => caches.match(event.request).then((cached) => cached || new Response("Offline", { status: 503 })))
    );
    return;
  }

  // Static assets (JS, CSS, images): cache-first for performance and offline
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? { title: "AeroBook", body: "You have a new notification" };
  event.waitUntil(
    self.registration.showNotification(data.title, { body: data.body, data: { url: data.url } })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(clients.openWindow(url));
});
