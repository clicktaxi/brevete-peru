/* Brevete Perú service worker: offline after first visit. */
const VERSION = "v1";
const SHELL = `shell-${VERSION}`;
const DATA = `data-${VERSION}`;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => ![SHELL, DATA].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "PRECACHE" && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(DATA).then((cache) =>
        Promise.all(
          event.data.urls.map((u) =>
            cache.match(u).then((hit) => hit || fetch(u).then((r) => (r.ok ? cache.put(u, r) : null)).catch(() => null)),
          ),
        ),
      ),
    );
  }
});

const isStatic = (url) => url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/images/") || url.pathname.startsWith("/data/") || /\.(png|svg|webp|woff2?|ico)$/.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (isStatic(url)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) caches.open(DATA).then((c) => c.put(req, res.clone()));
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode === "navigate" || req.headers.get("RSC")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(SHELL).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match(new URL(url.pathname.replace(/\/$/, "") + "/", url.origin).href))),
    );
  }
});
