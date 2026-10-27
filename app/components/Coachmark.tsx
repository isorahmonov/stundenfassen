"use client"

import { useEffect } from "react"

export function Coachmark({
  text,
  buttonLabel,
  onDismiss,
}: {
  text: string
  buttonLabel: string
  onDismiss: () => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onDismiss() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      // shortcut: z-10 assumes no stacking context above; raise if card gets transform/filter
      className="absolute bottom-full right-0 mb-3 z-10 w-56 rounded-xl bg-white dark:bg-neutral-800 border border-stone-200 dark:border-white/10 shadow-lg p-3"
    >
      {/* Arrow pointing down toward the star button */}
      <div
        aria-hidden
        className="absolute -bottom-1.5 right-3 w-3 h-3 bg-white dark:bg-neutral-800 border-r border-b border-stone-200 dark:border-white/10 rotate-45"
      />
      <p className="text-xs sf-text leading-relaxed mb-2">{text}</p>
      <button
        onClick={onDismiss}
        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
      >
        {buttonLabel}
      </button>
    </div>
  )
}
