import { getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy, where } from "firebase/firestore"
import type { MinusEintrag } from "@/lib/types"
import type { IMinusEintragRepository, MinusEintragInput, MinusEintragUpdate } from "../interfaces/IMinusEintragRepository"
import { userCol, userDoc, toMinusEintrag, fromMinusEintrag, type MinusEintragDoc } from "./shared"

function monatRange(monat: number, jahr: number): [string, string] {
  const mm = String(monat).padStart(2, "0")
  return [`${jahr}-${mm}-01`, `${jahr}-${mm}-31`]
}

export class MinusEintragRepository implements IMinusEintragRepository {
  async findById(id: string): Promise<MinusEintrag | undefined> {
    const snap = await getDoc(userDoc("minus_eintraege", id))
    return snap.exists() ? toMinusEintrag(snap.id, snap.data() as MinusEintragDoc) : undefined
  }

  async findByMonat(monat: number, jahr: number): Promise<MinusEintrag[]> {
    const [start, end] = monatRange(monat, jahr)
    const snap = await getDocs(
      query(userCol("minus_eintraege"), where("datum", ">=", start), where("datum", "<=", end), orderBy("datum"))
    )
    return snap.docs.map((d) => toMinusEintrag(d.id, d.data() as MinusEintragDoc))
  }

  async findByEmployerUndMonat(employerId: string, monat: number, jahr: number): Promise<MinusEintrag[]> {
    const [start, end] = monatRange(monat, jahr)
    const snap = await getDocs(
      query(
        userCol("minus_eintraege"),
        where("employerId", "==", employerId),
        where("datum", ">=", start),
        where("datum", "<=", end),
        orderBy("datum"),
      )
    )
    return snap.docs.map((d) => toMinusEintrag(d.id, d.data() as MinusEintragDoc))
  }

  async add(input: MinusEintragInput): Promise<MinusEintrag> {
    const id = crypto.randomUUID()
    await setDoc(userDoc("minus_eintraege", id), fromMinusEintrag(input))
    return { id, ...input }
  }

  async update(id: string, changes: MinusEintragUpdate): Promise<MinusEintrag | undefined> {
    const row: Partial<MinusEintragDoc> = {}
    if (changes.datum !== undefined) row.datum = changes.datum
    if (changes.minuten !== undefined) row.minuten = changes.minuten
    if (changes.employerId !== undefined) row.employerId = changes.employerId
    if ("notiz" in changes) row.notiz = changes.notiz ?? null
    await updateDoc(userDoc("minus_eintraege", id), row as Record<string, unknown>)
    return this.findById(id)
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(userDoc("minus_eintraege", id))
  }
}
