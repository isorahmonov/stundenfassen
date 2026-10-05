import MonatsUebersicht from "./components/MonatsUebersicht"
import { UpdateHinweis } from "./components/UpdateHinweis"

export default function Home() {
  return (
    <>
      <UpdateHinweis />
      <MonatsUebersicht />
    </>
  )
}
