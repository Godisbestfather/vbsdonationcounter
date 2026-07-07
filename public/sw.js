const CACHE_NAME = "vbs-donation-v4";
const SHELL_ASSETS = [
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

function offlineResponse(message, contentType = "text/plain") {
  return new Response(message, {
    status: 503,
    statusText: "Offline",
    headers: { "Content-Type": contentType }
  });
}

function isHtmlRequest(request, url) {
  return (
    request.mode === "navigate" ||
    url.pathname === "/" ||
    url.pathname.endsWith(".html")
  );
}

function asResponse(promise) {
  return promise.then((response) => {
    if (response instanceof Response) return response;
    return offlineResponse("Not available offline.");
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      asResponse(
        fetch(request).catch(() =>
          offlineResponse('{"error":"Network error"}', "application/json")
        )
      )
    );
    return;
  }

  if (isHtmlRequest(request, url) || url.pathname === "/manifest.json" || url.pathname === "/sw.js") {
    event.respondWith(
      asResponse(
        fetch(request)
          .then((response) => (response && response.ok ? response : caches.match(request)))
          .catch(() => caches.match(request))
      )
    );
    return;
  }

  event.respondWith(
    asResponse(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    )
  );
});
