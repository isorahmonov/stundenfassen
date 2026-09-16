import type { GeplanteSchicht } from "@/lib/types"

export type GeplanteSchichtInput = Omit<GeplanteSchicht, "id">
export type GeplanteSchichtUpdate = Partial<GeplanteSchichtInput>

export interface IGeplanteSchichtRepository {
  findById(id: string): Promise<GeplanteSchicht | undefined>
  findAlle(): Promise<GeplanteSchicht[]>
  findByZeitraum(von: string, bis: string): Promise<GeplanteSchicht[]>
  add(input: GeplanteSchichtInput): Promise<GeplanteSchicht>
  update(id: string, changes: GeplanteSchichtUpdate): Promise<GeplanteSchicht | undefined>
  remove(id: string): Promise<void>
}
