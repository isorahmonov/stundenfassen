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
 * Mobil: Bottom-Sheet (oben abgerundet). Desktop (sm+): zentriert, alle Ecken.
 * Inhalt-Layout: flex-col, damit scrollbarer Bereich + sticky Footer funktionieren.
 */
export function BaseDialog({ children, onBackdropClick, maxWidth = "max-w-lg" }: BaseDialogProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onBackdropClick}
      />
      {/* Sheet / Dialog-Karte */}
      <div
        className={`relative w-full ${maxWidth} sf-card shadow-2xl rounded-t-2xl sm:rounded-2xl flex flex-col`}
        style={{ maxHeight: "90dvh" }}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
