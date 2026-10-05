import ArbeitgeberVerwaltung from "@/app/components/ArbeitgeberVerwaltung"

export const metadata = { title: "Arbeitgeber – Stundenfassen" }

export default function ProfilArbeitgeberSeite() {
  return <ArbeitgeberVerwaltung backHref="/profil" />
}
