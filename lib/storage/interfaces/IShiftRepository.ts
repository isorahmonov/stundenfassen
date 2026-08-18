import type { Shift } from "@/lib/types";

export type ShiftInput = Omit<Shift, "id">;
export type ShiftUpdate = Partial<ShiftInput>;

export interface IShiftRepository {
  findById(id: string): Promise<Shift | undefined>;
  findAlle(): Promise<Shift[]>;
  findByMonat(monat: number, jahr: number): Promise<Shift[]>;
  findByEmployer(employerId: string): Promise<Shift[]>;
  findByEmployerUndMonat(employerId: string, monat: number, jahr: number): Promise<Shift[]>;
  add(input: ShiftInput): Promise<Shift>;
  update(id: string, changes: ShiftUpdate): Promise<Shift | undefined>;
  remove(id: string): Promise<void>;
}
