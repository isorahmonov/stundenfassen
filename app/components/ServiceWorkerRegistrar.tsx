"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    // Wenn ein neuer SW via skipWaiting/clients.claim die Kontrolle übernimmt,
    // Seite neu laden → frische HTML + aktuelle JS-Chunks.
    // hadController: false beim allerersten Install → kein Reload beim ersten Besuch.
    const hadController = !!navigator.serviceWorker.controller
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hadController) window.location.reload()
    })

    // ChunkLoadError durch veraltete HTML-Shell mit alten Chunk-Hashes → einmal neu laden.
    window.addEventListener("error", (event) => {
      const msg = event.message ?? ""
      if (
        msg.includes("ChunkLoadError") ||
        msg.includes("Loading chunk") ||
        msg.includes("Failed to fetch dynamically imported module")
      ) {
        if (!sessionStorage.getItem("sf-chunk-reload")) {
          sessionStorage.setItem("sf-chunk-reload", "1")
          window.location.reload()
        }
      }
    })

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW-Registrierung ist optional — kein Hard Fail
    })
  }, [])
  return null
}
