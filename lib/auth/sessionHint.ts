const KEY = "sf_session_hint"
const FB_PREFIX = "firebase:authUser:"

/** Call when Firebase confirms a user is logged in. */
export function setSessionHint(): void {
  try { localStorage.setItem(KEY, "1") } catch { /* ignore */ }
}

/** Call on sign-out / account delete. Also called automatically by AuthGate. */
export function clearSessionHint(): void {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}

/** True when a previous session was confirmed — we probably still have a user. */
export function hasSessionHint(): boolean {
  try { return localStorage.getItem(KEY) === "1" } catch { return false }
}

/**
 * Pure decision: should AuthGate wait for Firebase before showing content?
 * hinweis: current value of sf_session_hint
 * keys: all storage keys to check (localStorage + optionally IndexedDB)
 * Exported for unit tests only — use sollteWarten() in application code.
 */
export function sollteWartenFuer(hinweis: boolean, keys: string[]): boolean {
  if (hinweis) return true
  return keys.some(k => k.startsWith(FB_PREFIX))
}

function lsKeys(): string[] {
  try {
    return Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i) ?? "")
  } catch { return [] }
}

// shortcut: only checks "firebaseLocalStorageDb"; other DB names are not used by Firebase Auth
function idbKeys(): Promise<string[]> {
  return new Promise(resolve => {
    try {
      const req = indexedDB.open("firebaseLocalStorageDb")
      req.onsuccess = ev => {
        const db = (ev.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains("firebaseLocalStorage")) {
          db.close(); resolve([]); return
        }
        const store = db.transaction("firebaseLocalStorage", "readonly").objectStore("firebaseLocalStorage")
        const q = store.getAllKeys()
        q.onsuccess = () => { db.close(); resolve(q.result.map(String)) }
        q.onerror = () => { db.close(); resolve([]) }
      }
      req.onerror = () => resolve([])
    } catch { resolve([]) }
  })
}

/**
 * Returns true when AuthGate should wait for Firebase before showing content.
 * Checks our hint, localStorage, and IndexedDB (Firebase uses either depending on version).
 */
export async function sollteWarten(): Promise<boolean> {
  const hinweis = hasSessionHint()
  const ls = lsKeys()
  if (sollteWartenFuer(hinweis, ls)) return true
  return sollteWartenFuer(false, await idbKeys())
}
