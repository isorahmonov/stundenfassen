import { APP_NAME } from "@/lib/brand"
import { assertKeinePlatzhalter } from "@/lib/legal"
import { DatenschutzContent } from "./DatenschutzContent"

export const metadata = { title: `Datenschutz – ${APP_NAME}` }

export default function DatenschutzSeite() {
  assertKeinePlatzhalter()
  return <DatenschutzContent />
}
