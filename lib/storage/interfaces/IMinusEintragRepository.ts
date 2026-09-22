import type { MinusEintrag } from "@/lib/types"

export type MinusEintragInput = Omit<MinusEintrag, "id">
export type MinusEintragUpdate = Partial<MinusEintragInput>

export interface IMinusEintragRepository {
  findById(id: string): Promise<MinusEintrag | undefined>
  findByMonat(monat: number, jahr: number): Promise<MinusEintrag[]>
  findByEmployerUndMonat(employerId: string, monat: number, jahr: number): Promise<MinusEintrag[]>
  add(input: MinusEintragInput): Promise<MinusEintrag>
  update(id: string, changes: MinusEintragUpdate): Promise<MinusEintrag | undefined>
  remove(id: string): Promise<void>
}
