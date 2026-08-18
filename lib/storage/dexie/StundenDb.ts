import Dexie, { type EntityTable } from "dexie";
import type { Abgleich, Employer, Settings, Shift } from "@/lib/types";

export class StundenDb extends Dexie {
  employers!: EntityTable<Employer, "id">;
  shifts!: EntityTable<Shift, "id">;
  settings!: EntityTable<Settings, "id">;
  abgleich!: EntityTable<Abgleich, "id">;

  constructor() {
    super("stundenfassen");

    this.version(1).stores({
      employers: "&id, art",
      shifts: "&id, employerId, datum, [employerId+datum]",
      settings: "&id",
      abgleich: "&id, employerId, [employerId+monat+jahr], [monat+jahr]",
    });
  }
}
