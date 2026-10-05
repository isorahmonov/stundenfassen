import { getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore"
import type { EmailVorlage } from "@/lib/types"
import type { IEmailVorlageRepository, EmailVorlageInput, EmailVorlageUpdate } from "../interfaces/IEmailVorlageRepository"
import { userCol, userDoc, toEmailVorlage, fromEmailVorlage, type EmailVorlageDoc } from "./shared"

export class EmailVorlageRepository implements IEmailVorlageRepository {
  async findAlle(): Promise<EmailVorlage[]> {
    const snap = await getDocs(query(userCol("email_vorlagen"), orderBy("name")))
    return snap.docs.map((d) => toEmailVorlage(d.id, d.data() as EmailVorlageDoc))
  }

  async findById(id: string): Promise<EmailVorlage | undefined> {
    const snap = await getDoc(userDoc("email_vorlagen", id))
    return snap.exists() ? toEmailVorlage(snap.id, snap.data() as EmailVorlageDoc) : undefined
  }

  async add(input: EmailVorlageInput): Promise<EmailVorlage> {
    const id = crypto.randomUUID()
    await setDoc(userDoc("email_vorlagen", id), fromEmailVorlage(input))
    return { id, ...input }
  }

  async update(id: string, changes: EmailVorlageUpdate): Promise<void> {
    const row: Partial<EmailVorlageDoc> = {}
    if (changes.name !== undefined) row.name = changes.name
    if (changes.betreff !== undefined) row.betreff = changes.betreff
    if (changes.text !== undefined) row.text = changes.text
    if (changes.empfaenger !== undefined) row.empfaenger = changes.empfaenger ?? null
    if (changes.cc !== undefined) row.cc = changes.cc ?? null
    await updateDoc(userDoc("email_vorlagen", id), row as Record<string, unknown>)
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(userDoc("email_vorlagen", id))
  }
}
