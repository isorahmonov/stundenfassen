"use client"

import { useRef, type ButtonHTMLAttributes, type ReactNode } from "react"
import styles from "./Button.module.css"

type Variant = "primary" | "secondary"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
  magnetic?: boolean
  children: ReactNode
}

/** Magnetic pull on fine-pointer devices; sets --tx/--ty consumed by CSS transform. */
function useMagnetic(enabled: boolean) {
  const ref = useRef<HTMLButtonElement>(null)

  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!enabled) return
    if (!window.matchMedia("(pointer: fine)").matches) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - (r.left + r.width / 2)) * 0.25
    const y = (e.clientY - (r.top + r.height / 2)) * 0.25
    el.style.setProperty("--tx", `${x}px`)
    el.style.setProperty("--ty", `${y}px`)
  }

  const reset = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty("--tx", "0px")
    el.style.setProperty("--ty", "0px")
  }

  return { ref, onMove, reset }
}

export function Button({
  variant = "primary",
  loading = false,
  magnetic = false,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  const { ref, onMove, reset } = useMagnetic(magnetic)

  return (
    <button
      ref={ref}
      className={`${styles.btn} ${styles[variant]} ${className}`}
      disabled={disabled || loading}
      onPointerMove={onMove}
      onPointerLeave={reset}
      {...rest}
    >
      {variant === "primary" && <span className={styles.shimmer} aria-hidden="true" />}
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  )
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode
  loading?: boolean
  suggested?: boolean
}

/** Round 56px icon-only provider button. */
export function IconButton({
  icon,
  loading = false,
  suggested = false,
  className = "",
  disabled,
  ...rest
}: IconButtonProps) {
  return (
    <button
      className={`${styles.iconBtn}${suggested ? ` ${styles.suggested}` : ""} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        <span className={styles.iconBtnIcon} aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  )
}

type ProviderButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode
  loading?: boolean
  children: ReactNode
}

/** Sign-in provider button with a consistent, AA-contrast surface in both themes. */
export function ProviderButton({
  icon,
  loading = false,
  children,
  className = "",
  disabled,
  ...rest
}: ProviderButtonProps) {
  return (
    <button
      className={`${styles.btn} ${styles.provider} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  )
}
