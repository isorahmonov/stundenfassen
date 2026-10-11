const KEY = "sf_session_hint"

/** Call when Firebase confirms a user is logged in. */
export function setSessionHint(): void {
  try { localStorage.setItem(KEY, "1") } catch { /* ignore */ }
}

/** Call on sign-out / account delete. Automatically called by AuthGate too. */
export function clearSessionHint(): void {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}

/** True when a previous session was confirmed — we probably still have a user. */
export function hasSessionHint(): boolean {
  try { return localStorage.getItem(KEY) === "1" } catch { return false }
}
