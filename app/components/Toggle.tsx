"use client"

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Accessible label — required when there is no adjacent visible text label */
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative w-11 h-6 rounded-full flex-shrink-0",
        "transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        "disabled:opacity-40 disabled:pointer-events-none",
        checked ? "bg-blue-500" : "bg-stone-300 dark:bg-neutral-600",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm",
          "transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  )
}
