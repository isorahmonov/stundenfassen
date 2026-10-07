import { getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore"
import type { Employer } from "@/lib/types"
import type { IEmployerRepository, EmployerInput, EmployerUpdate } from "../interfaces/IEmployerRepository"
import { userCol, userDoc, toEmployer, fromEmployer, type EmployerDoc } from "./shared"
import { buildUpdateRow } from "./employerUpdateRow"

export { buildUpdateRow }

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
    const row = buildUpdateRow(changes)
    await updateDoc(userDoc("employers", id), row as Record<string, unknown>)
    return this.findById(id)
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(userDoc("employers", id))
  }
}
