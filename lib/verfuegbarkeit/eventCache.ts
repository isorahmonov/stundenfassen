// Typ stimmt mit der API-Antwort von /api/ical überein (Dates als ISO-Strings)
export interface TerminRoh {
  uid: string
  titel: string
  beginn: string
  ende: string
  ganztaegig: boolean
  ort?: string
}

interface CacheEntry {
  termine: TerminRoh[]
  timestamp: number
}

// In-Memory-Cache überlebt Tab-Wechsel innerhalb der Session
const MEM = new Map<string, CacheEntry>()

// 2 Minuten: Schutz gegen Doppelklicks, aber immer frische Daten nach Tab-Wechsel
const TTL = 2 * 60 * 1000

// Version 2: erzwingt Invalidierung alter 23h-Einträge in bestehenden Browsern
const LS_PREFIX = "sf_ical2_"

export function getCachedTermine(key: string): TerminRoh[] | null {
  const mem = MEM.get(key)
  if (mem && Date.now() - mem.timestamp < TTL) return mem.termine

  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    if (Date.now() - entry.timestamp >= TTL) {
      localStorage.removeItem(LS_PREFIX + key)
      return null
    }
    MEM.set(key, entry)
    return entry.termine
  } catch {
    return null
  }
}

/** Gibt gecachte Daten zurück, auch wenn sie abgelaufen sind (für stale-while-revalidate). */
export function getStaleTermine(key: string): TerminRoh[] | null {
  const mem = MEM.get(key)
  if (mem) return mem.termine
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    MEM.set(key, entry) // in Memory aufnehmen, auch wenn abgelaufen
    return entry.termine
  } catch {
    return null
  }
}

/** Gibt den Zeitstempel eines Cache-Eintrags zurück (auch abgelaufen). */
export function getStaleTimestamp(key: string): number | null {
  const mem = MEM.get(key)
  if (mem) return mem.timestamp
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    if (!raw) return null
    return (JSON.parse(raw) as CacheEntry).timestamp
  } catch {
    return null
  }
}

export function setCachedTermine(key: string, termine: TerminRoh[]) {
  const entry: CacheEntry = { termine, timestamp: Date.now() }
  MEM.set(key, entry)
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(entry))
  } catch {
    // localStorage voll oder nicht verfügbar — nur In-Memory nutzen
  }
}

// Block-Auswahl: pro Woche persistent speichern
const SEL_PREFIX = "sf_sel_"

export function loadSavedSelection(sonntagStr: string): Set<string> {
  try {
    const raw = localStorage.getItem(SEL_PREFIX + sonntagStr)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

export function saveSelection(sonntagStr: string, keys: Set<string>) {
  try {
    localStorage.setItem(SEL_PREFIX + sonntagStr, JSON.stringify([...keys]))
  } catch { /* silent */ }
}
