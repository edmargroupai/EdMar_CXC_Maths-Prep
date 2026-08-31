/* EdMar service worker (§20.5) — caches revealed response blocks only. */
const CACHE_NAME = "edmar-v1";

const NEVER_CACHE_RPC = [
  "fn_get_readiness",
  "fn_get_grade_projection",
  "fn_weak_areas",
  "fn_get_recommendation",
  "fn_get_entitlement",
];

const NEVER_CACHE_TABLES = [
  "/rest/v1/student_skill_mastery",
  "/rest/v1/student_topic_mastery",
  "/rest/v1/entitlements",
  "/rest/v1/readiness_snapshots",
  "/rest/v1/grade_projections",
];

function shouldNeverCache(url) {
  if (!url.pathname.includes("/rest/v1/")) return false;
  if (NEVER_CACHE_RPC.some((name) => url.pathname.includes(name))) return true;
  return NEVER_CACHE_TABLES.some((prefix) => url.pathname.startsWith(prefix));
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (shouldNeverCache(url)) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" }).catch(() =>
        Response.json(
          { message: "offline", stale: true, as_of: null },
          { status: 503, headers: { "x-edmar-stale": "1" } },
        ),
      ),
    );
    return;
  }

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
