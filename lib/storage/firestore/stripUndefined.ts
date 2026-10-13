function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype
}

/** Rekursiv undefined-Felder aus einem Plain-Object entfernen.
 *  Arrays, null und Klassen-Instanzen (z.B. Firestore FieldValue) bleiben unverändert. */
export function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue
    result[k] = isPlainObject(v) ? stripUndefined(v) : v
  }
  return result as T
}
