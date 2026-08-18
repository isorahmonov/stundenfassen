import { getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore"
import type { Abgleich } from "@/lib/types"
import type { IAbgleichRepository, AbgleichInput, AbgleichUpdate } from "../interfaces/IAbgleichRepository"
import { userCol, userDoc, toAbgleich, type AbgleichDoc } from "./shared"

export class AbgleichRepository implements IAbgleichRepository {
  async findById(id: string): Promise<Abgleich | undefined> {
    const snap = await getDoc(userDoc("abgleich", id))
    return snap.exists() ? toAbgleich(snap.id, snap.data() as AbgleichDoc) : undefined
  }

  async findByMonatJahr(monat: number, jahr: number): Promise<Abgleich[]> {
    const snap = await getDocs(
      query(userCol("abgleich"), where("monat", "==", monat), where("jahr", "==", jahr))
    )
    return snap.docs.map(d => toAbgleich(d.id, d.data() as AbgleichDoc))
  }

  async findByEmployer(employerId: string): Promise<Abgleich[]> {
    const snap = await getDocs(
      query(userCol("abgleich"), where("employerId", "==", employerId))
    )
    return snap.docs.map(d => toAbgleich(d.id, d.data() as AbgleichDoc))
  }

  async findByEmployerUndMonatJahr(
    employerId: string,
    monat: number,
    jahr: number,
  ): Promise<Abgleich | undefined> {
    const snap = await getDocs(
      query(
        userCol("abgleich"),
        where("employerId", "==", employerId),
        where("monat", "==", monat),
        where("jahr", "==", jahr),
      )
    )
    if (snap.empty) return undefined
    const d = snap.docs[0]
    return toAbgleich(d.id, d.data() as AbgleichDoc)
  }

  async add(input: AbgleichInput): Promise<Abgleich> {
    const id = crypto.randomUUID()
    const data: AbgleichDoc = {
      employerId: input.employerId, monat: input.monat, jahr: input.jahr,
      lautAbrechnungStunden: input.lautAbrechnungStunden ?? null,
      tatsaechlichAusgezahltCent: input.tatsaechlichAusgezahltCent ?? null,
    }
    await setDoc(userDoc("abgleich", id), data)
    return toAbgleich(id, data)
  }

  async update(id: string, changes: AbgleichUpdate): Promise<Abgleich | undefined> {
    const row: Partial<AbgleichDoc> = {}
    if ("lautAbrechnungStunden" in changes) row.lautAbrechnungStunden = changes.lautAbrechnungStunden ?? null
    if ("tatsaechlichAusgezahltCent" in changes) row.tatsaechlichAusgezahltCent = changes.tatsaechlichAusgezahltCent ?? null
    await updateDoc(userDoc("abgleich", id), row as Record<string, unknown>)
    return this.findById(id)
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(userDoc("abgleich", id))
  }
}
