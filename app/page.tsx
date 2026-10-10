import type { Metadata } from "next"
import { APP_NAME } from "@/lib/brand"
import { translations, DEFAULT_LOCALE } from "@/lib/i18n"
import MonatsUebersicht from "./components/MonatsUebersicht"
import { UpdateHinweis } from "./components/UpdateHinweis"

// Landing is the indexable public entry; metadata uses DEFAULT_LOCALE
// (locale is client-side only, so server-rendered metadata can't vary by it).
const landing = translations[DEFAULT_LOCALE]

export const metadata: Metadata = {
  title: `${APP_NAME} – ${landing.LANDING_HERO_TITEL}`,
  description: landing.LANDING_HERO_UNTERTITEL,
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} – ${landing.LANDING_HERO_TITEL}`,
    description: landing.LANDING_HERO_UNTERTITEL,
  },
}

export default function Home() {
  return (
    <>
      <UpdateHinweis />
      <MonatsUebersicht />
    </>
  )
}
