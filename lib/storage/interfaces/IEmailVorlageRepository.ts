import type { EmailVorlage } from "@/lib/types"

export type EmailVorlageInput = Omit<EmailVorlage, "id">
export type EmailVorlageUpdate = Partial<EmailVorlageInput>

export interface IEmailVorlageRepository {
  findAlle(): Promise<EmailVorlage[]>
  findById(id: string): Promise<EmailVorlage | undefined>
  add(input: EmailVorlageInput): Promise<EmailVorlage>
  update(id: string, changes: EmailVorlageUpdate): Promise<void>
  remove(id: string): Promise<void>
}
