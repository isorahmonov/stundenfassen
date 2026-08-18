import { getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore"
import type { Employer } from "@/lib/types"
import type { IEmployerRepository, EmployerInput, EmployerUpdate } from "../interfaces/IEmployerRepository"
import { userCol, userDoc, toEmployer, fromEmployer, type EmployerDoc } from "./shared"

export class EmployerRepository implements IEmployerRepository {
  async findById(id: string): Promise<Employer | undefined> {
    const snap = await getDoc(userDoc("employers", id))
    return snap.exists() ? toEmployer(snap.id, snap.data() as EmployerDoc) : undefined
  }

  async findAlle(): Promise<Employer[]> {
    const snap = await getDocs(query(userCol("employers"), orderBy("name")))
    return snap.docs.map(d => toEmployer(d.id, d.data() as EmployerDoc))
  }

  async findAktive(): Promise<Employer[]> {
    const alle = await this.findAlle()
    return alle.filter(e => !e.archiviert)
  }

  async add(input: EmployerInput): Promise<Employer> {
    const id = crypto.randomUUID()
    const ref = userDoc("employers", id)
    await setDoc(ref, fromEmployer(input))
    return { id, ...input, archiviert: input.archiviert ?? false }
  }

  async update(id: string, changes: EmployerUpdate): Promise<Employer | undefined> {
    const ref = userDoc("employers", id)
    const row: Partial<EmployerDoc> = {}
    if (changes.name !== undefined) row.name = changes.name
    if (changes.farbe !== undefined) row.farbe = changes.farbe
    if (changes.art !== undefined) row.art = changes.art
    if (changes.stundenlohnCent !== undefined) row.stundenlohnCent = changes.stundenlohnCent
    if (changes.zuschlagSonntagProzent !== undefined) row.zuschlagSonntagProzent = changes.zuschlagSonntagProzent
    if (changes.zuschlagFeiertagProzent !== undefined) row.zuschlagFeiertagProzent = changes.zuschlagFeiertagProzent
    if (changes.zuschlagNachtProzent !== undefined) row.zuschlagNachtProzent = changes.zuschlagNachtProzent
    if (changes.archiviert !== undefined) row.archiviert = changes.archiviert ?? false
    await updateDoc(ref, row as Record<string, unknown>)
    return this.findById(id)
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(userDoc("employers", id))
  }
}
