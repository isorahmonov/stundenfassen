import { APP_NAME } from "@/lib/brand"
import { assertKeinePlatzhalter } from "@/lib/legal"
import { ImpressumContent } from "./ImpressumContent"

export const metadata = { title: `Impressum – ${APP_NAME}` }

export default function ImpressumSeite() {
  assertKeinePlatzhalter()
  return <ImpressumContent />
}
