"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase/client"
import LoginView from "@/app/components/auth/LoginView"

// Indexable (no noindex) — inherits the layout's title/description metadata.
// Logged-out visitors are served LoginView by AuthGate; an already-authed user
// who lands here is sent to the app.
export default function AnmeldenPage() {
  const router = useRouter()
  useEffect(() => onAuthStateChanged(auth, (u) => { if (u) router.replace("/") }), [router])
  return <LoginView />
}
