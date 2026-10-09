/** Wraps a promise with a hard timeout. Rejects with a plain Error after `ms` milliseconds. */
export function withTimeout<T>(promise: Promise<T>, ms = 10_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Zeitüberschreitung (${ms / 1000} s) — Verbindung prüfen`)),
      ms,
    )
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) },
    )
  })
}
