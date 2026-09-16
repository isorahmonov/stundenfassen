"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW-Registrierung ist optional — kein Hard Fail
    })
  }, [])
  return null
}
