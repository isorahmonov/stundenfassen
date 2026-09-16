const CACHE = "sf-v1"

// Static assets von Next.js sind content-hashed — aggressiv cachen
const STATIC_ORIGINS = self.location.origin

self.addEventListener("install", (event) => {
  // Übernimm sofort die Kontrolle, ohne auf Tab-Schließen zu warten
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  // Alte Cache-Versionen löschen
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Nur eigenen Origin behandeln
  if (url.origin !== STATIC_ORIGINS) return
  // Nur GET
  if (request.method !== "GET") return

  // API-Routen: immer Netzwerk (Auth-Token, dynamische Daten)
  if (url.pathname.startsWith("/api/")) return

  // Next.js Static Assets (content-hashed): Cache-First
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone()
              caches.open(CACHE).then((c) => c.put(request, clone))
            }
            return res
          }),
      ),
    )
    return
  }

  // Icons & andere statische Dateien in /public: Cache-First
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.match(/\.(png|ico|svg|webp|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone()
              caches.open(CACHE).then((c) => c.put(request, clone))
            }
            return res
          }),
      ),
    )
    return
  }

  // HTML-Navigation (App-Shell): Stale-While-Revalidate
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone()
              caches.open(CACHE).then((c) => c.put(request, clone))
            }
            return res
          })
          .catch(() => cached) // Offline: Fallback auf gecachte Version
        return cached ?? network
      }),
    )
  }
})
