"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [passwort, setPasswort] = useState("")
  const [laedt, setLaedt] = useState(false)
  const [fehler, setFehler] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFehler("")
    setLaedt(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: passwort })
      if (error) throw error
      router.replace("/")
    } catch (err: unknown) {
      setFehler(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen")
    } finally {
      setLaedt(false)
    }
  }

  return (
    <div className="min-h-screen sf-page flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-neutral-100 mb-1">
            Stundenfassen
          </h1>
          <p className="text-sm text-stone-500 dark:text-neutral-400">
            Zeiterfassung für Studentenjobs
          </p>
        </div>

        <div className="sf-card rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)]">
          <form onSubmit={handleSubmit}>
            <p className="text-sm font-semibold text-stone-700 dark:text-neutral-300 mb-4">
              Anmelden
            </p>
            <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1.5">
              E-Mail-Adresse
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@beispiel.de"
              autoFocus
              autoComplete="email"
              className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2.5 text-sm text-stone-900 dark:text-neutral-100 placeholder:text-stone-300 dark:placeholder:text-neutral-600 outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow mb-3"
            />
            <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1.5">
              Passwort
            </label>
            <input
              type="password"
              required
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 sf-input px-3 py-2.5 text-sm text-stone-900 dark:text-neutral-100 outline-none focus:border-stone-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-neutral-700 transition-shadow mb-3"
            />
            {fehler && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-3">
                {fehler}
              </p>
            )}
            <button
              type="submit"
              disabled={laedt}
              className="w-full rounded-xl bg-stone-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-semibold py-2.5 text-sm disabled:opacity-50 active:scale-[.99] transition-all"
            >
              {laedt ? "Anmelden…" : "Anmelden"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
