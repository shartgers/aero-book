const CACHE_NAME = "aerobook-v1";
const STATIC_ASSETS = ["/", "/aircraft", "/bookings", "/bills"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  // Network-first for API routes, cache-first for static assets
  if (event.request.url.includes("/api/")) {
    event.respondWith(fetch(event.request).catch(() => new Response("Offline", { status: 503 })));
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
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
