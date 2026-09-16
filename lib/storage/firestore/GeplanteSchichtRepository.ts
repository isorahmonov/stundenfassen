import { getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy, where } from "firebase/firestore"
import type { GeplanteSchicht } from "@/lib/types"
import type { IGeplanteSchichtRepository, GeplanteSchichtInput, GeplanteSchichtUpdate } from "../interfaces/IGeplanteSchichtRepository"
import { userCol, userDoc, toGeplanteSchicht, fromGeplanteSchicht, type GeplanteSchichtDoc } from "./shared"

export class GeplanteSchichtRepository implements IGeplanteSchichtRepository {
  async findById(id: string): Promise<GeplanteSchicht | undefined> {
    const snap = await getDoc(userDoc("geplante_schichten", id))
    return snap.exists() ? toGeplanteSchicht(snap.id, snap.data() as GeplanteSchichtDoc) : undefined
  }

  async findAlle(): Promise<GeplanteSchicht[]> {
    const snap = await getDocs(query(userCol("geplante_schichten"), orderBy("datum")))
    return snap.docs.map(d => toGeplanteSchicht(d.id, d.data() as GeplanteSchichtDoc))
  }

  async findByZeitraum(von: string, bis: string): Promise<GeplanteSchicht[]> {
    const snap = await getDocs(
      query(userCol("geplante_schichten"), where("datum", ">=", von), where("datum", "<=", bis), orderBy("datum"))
    )
    return snap.docs.map(d => toGeplanteSchicht(d.id, d.data() as GeplanteSchichtDoc))
  }

  async add(input: GeplanteSchichtInput): Promise<GeplanteSchicht> {
    const id = crypto.randomUUID()
    await setDoc(userDoc("geplante_schichten", id), fromGeplanteSchicht(input))
    return { id, ...input }
  }

  async update(id: string, changes: GeplanteSchichtUpdate): Promise<GeplanteSchicht | undefined> {
    const row: Partial<GeplanteSchichtDoc> = {}
    if (changes.datum !== undefined) row.datum = changes.datum
    if (changes.start !== undefined) row.start = changes.start
    if (changes.ende !== undefined) row.ende = changes.ende
    if (changes.employerId !== undefined) row.employerId = changes.employerId
    if (changes.uebernommen !== undefined) row.uebernommen = changes.uebernommen
    if ("uebernommenShiftId" in changes) row.uebernommenShiftId = changes.uebernommenShiftId ?? null
    await updateDoc(userDoc("geplante_schichten", id), row as Record<string, unknown>)
    return this.findById(id)
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(userDoc("geplante_schichten", id))
  }
}
