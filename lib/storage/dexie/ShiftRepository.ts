import type { Shift } from "@/lib/types";
import type {
  IShiftRepository,
  ShiftInput,
  ShiftUpdate,
} from "../interfaces/IShiftRepository";
import type { StundenDb } from "./StundenDb";

function monatRange(monat: number, jahr: number): [string, string] {
  const mm = String(monat).padStart(2, "0");
  return [`${jahr}-${mm}-01`, `${jahr}-${mm}-31`];
}

export class ShiftRepository implements IShiftRepository {
  constructor(private readonly db: StundenDb) {}

  findById(id: string): Promise<Shift | undefined> {
    return this.db.shifts.get(id);
  }

  findAlle(): Promise<Shift[]> {
    return this.db.shifts.toArray();
  }

  findByMonat(monat: number, jahr: number): Promise<Shift[]> {
    const [start, end] = monatRange(monat, jahr);
    return this.db.shifts.where("datum").between(start, end, true, true).toArray();
  }

  findByEmployer(employerId: string): Promise<Shift[]> {
    return this.db.shifts.where("employerId").equals(employerId).toArray();
  }

  findByEmployerUndMonat(employerId: string, monat: number, jahr: number): Promise<Shift[]> {
    const [start, end] = monatRange(monat, jahr);
    return this.db.shifts
      .where("[employerId+datum]")
      .between([employerId, start], [employerId, end], true, true)
      .toArray();
  }

  async add(input: ShiftInput): Promise<Shift> {
    const shift: Shift = { ...input, id: crypto.randomUUID() };
    await this.db.shifts.add(shift);
    return shift;
  }

  async update(id: string, changes: ShiftUpdate): Promise<Shift | undefined> {
    await this.db.shifts.update(id, changes);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.db.shifts.delete(id);
  }
}
