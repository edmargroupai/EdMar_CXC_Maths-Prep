/* EdMar service worker skeleton (§20.5) — caches revealed response blocks only. */
const CACHE_NAME = "edmar-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.includes("/rest/v1/rpc/fn_reveal_response")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }
  event.respondWith(fetch(event.request));
});
