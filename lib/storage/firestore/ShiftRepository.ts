import { getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy, where } from "firebase/firestore"
import type { Shift } from "@/lib/types"
import type { IShiftRepository, ShiftInput, ShiftUpdate } from "../interfaces/IShiftRepository"
import { userCol, userDoc, toShift, fromShift, type ShiftDoc } from "./shared"

function monatRange(monat: number, jahr: number): [string, string] {
  const mm = String(monat).padStart(2, "0")
  return [`${jahr}-${mm}-01`, `${jahr}-${mm}-31`]
}

export class ShiftRepository implements IShiftRepository {
  async findById(id: string): Promise<Shift | undefined> {
    const snap = await getDoc(userDoc("shifts", id))
    return snap.exists() ? toShift(snap.id, snap.data() as ShiftDoc) : undefined
  }

  async findAlle(): Promise<Shift[]> {
    const snap = await getDocs(query(userCol("shifts"), orderBy("datum")))
    return snap.docs.map(d => toShift(d.id, d.data() as ShiftDoc))
  }

  async findByMonat(monat: number, jahr: number): Promise<Shift[]> {
    const [start, end] = monatRange(monat, jahr)
    const snap = await getDocs(
      query(userCol("shifts"), where("datum", ">=", start), where("datum", "<=", end), orderBy("datum"))
    )
    return snap.docs.map(d => toShift(d.id, d.data() as ShiftDoc))
  }

  async findByEmployer(employerId: string): Promise<Shift[]> {
    const snap = await getDocs(
      query(userCol("shifts"), where("employerId", "==", employerId), orderBy("datum", "desc"))
    )
    return snap.docs.map(d => toShift(d.id, d.data() as ShiftDoc))
  }

  async findByEmployerUndMonat(employerId: string, monat: number, jahr: number): Promise<Shift[]> {
    const [start, end] = monatRange(monat, jahr)
    const snap = await getDocs(
      query(
        userCol("shifts"),
        where("employerId", "==", employerId),
        where("datum", ">=", start),
        where("datum", "<=", end),
        orderBy("datum"),
      )
    )
    return snap.docs.map(d => toShift(d.id, d.data() as ShiftDoc))
  }

  async add(input: ShiftInput): Promise<Shift> {
    const id = crypto.randomUUID()
    await setDoc(userDoc("shifts", id), fromShift(input))
    return { id, ...input }
  }

  async update(id: string, changes: ShiftUpdate): Promise<Shift | undefined> {
    const row: Partial<ShiftDoc> = {}
    if (changes.datum !== undefined) row.datum = changes.datum
    if (changes.start !== undefined) row.start = changes.start
    if (changes.ende !== undefined) row.ende = changes.ende
    if ("pauseVon" in changes) row.pauseVon = changes.pauseVon ?? null
    if ("pauseBis" in changes) row.pauseBis = changes.pauseBis ?? null
    if ("notiz" in changes) row.notiz = changes.notiz ?? null
    await updateDoc(userDoc("shifts", id), row as Record<string, unknown>)
    return this.findById(id)
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(userDoc("shifts", id))
  }
}
