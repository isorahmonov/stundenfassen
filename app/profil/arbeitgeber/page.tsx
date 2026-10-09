import ArbeitgeberVerwaltung from "@/app/components/ArbeitgeberVerwaltung"
import { APP_NAME } from "@/lib/brand"

export const metadata = { title: `Arbeitgeber – ${APP_NAME}` }

export default function ProfilArbeitgeberSeite() {
  return <ArbeitgeberVerwaltung backHref="/profil" />
}
