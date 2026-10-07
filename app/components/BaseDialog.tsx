"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

interface BaseDialogProps {
  children: React.ReactNode
  onBackdropClick?: () => void
  /** Tailwind max-width-Klasse, z. B. "max-w-sm" oder "max-w-lg" */
  maxWidth?: string
}

/**
 * Portal-Dialog: rendert in document.body, z-index über der TabBar.
 * Immer zentriert (kein Bottom-Sheet). Inhalt-Layout: flex-col,
 * damit scrollbarer Bereich + sticky Footer funktionieren.
 */
export function BaseDialog({ children, onBackdropClick, maxWidth = "max-w-lg" }: BaseDialogProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Hintergrund-Scroll sperren, solange Dialog offen
  useEffect(() => {
    if (!mounted) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [mounted])

  // ESC schließt den Dialog (nur wenn onBackdropClick gesetzt)
  useEffect(() => {
    if (!mounted || !onBackdropClick) return
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onBackdropClick!() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mounted, onBackdropClick])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onBackdropClick}
      />
      {/* Dialog-Karte */}
      <div
        className={`relative w-full ${maxWidth} sf-card shadow-2xl rounded-2xl flex flex-col`}
        style={{ maxHeight: "85dvh" }}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
