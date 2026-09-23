import { getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore"
import type { MinusEintrag } from "@/lib/types"
import type { IMinusEintragRepository, MinusEintragInput, MinusEintragUpdate } from "../interfaces/IMinusEintragRepository"
import { userCol, userDoc, toMinusEintrag, fromMinusEintrag, type MinusEintragDoc } from "./shared"

export class MinusEintragRepository implements IMinusEintragRepository {
  async findById(id: string): Promise<MinusEintrag | undefined> {
    const snap = await getDoc(userDoc("minus_eintraege", id))
    return snap.exists() ? toMinusEintrag(snap.id, snap.data() as MinusEintragDoc) : undefined
  }

  async findAlle(): Promise<MinusEintrag[]> {
    const snap = await getDocs(query(userCol("minus_eintraege"), orderBy("datum", "desc")))
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
    if ("notiz" in changes) row.notiz = changes.notiz ?? null
    await updateDoc(userDoc("minus_eintraege", id), row as Record<string, unknown>)
    return this.findById(id)
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(userDoc("minus_eintraege", id))
  }
}
