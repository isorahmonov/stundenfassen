"use client"

import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import LoginPage from "@/app/login/page"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLaden(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (laden) {
    return (
      <div className="min-h-screen sf-page flex items-center justify-center">
        <span className="text-sm text-stone-400 dark:text-neutral-500">Lade…</span>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return <>{children}</>
}
