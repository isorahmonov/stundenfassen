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
      style={{ backgroundColor: checked ? "#3b82f6" : undefined }}
      className={[
        "relative inline-flex flex-shrink-0",
        "w-12 h-7 rounded-full",
        checked ? "" : "bg-stone-300 dark:bg-neutral-600",
        "transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        "disabled:opacity-40 disabled:pointer-events-none",
      ].join(" ")}
    >
      <span
        aria-hidden
        className="absolute top-[2px] left-[2px] w-6 h-6 rounded-full bg-white shadow-sm"
        style={{
          transform: checked ? "translateX(20px)" : "translateX(0)",
          transition: "transform 200ms",
        }}
      />
    </button>
  )
}
