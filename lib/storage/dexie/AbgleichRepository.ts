import type { Abgleich } from "@/lib/types";
import type {
  AbgleichInput,
  AbgleichUpdate,
  IAbgleichRepository,
} from "../interfaces/IAbgleichRepository";
import type { StundenDb } from "./StundenDb";

export class AbgleichRepository implements IAbgleichRepository {
  constructor(private readonly db: StundenDb) {}

  findById(id: string): Promise<Abgleich | undefined> {
    return this.db.abgleich.get(id);
  }

  findByMonatJahr(monat: number, jahr: number): Promise<Abgleich[]> {
    return this.db.abgleich.where("[monat+jahr]").equals([monat, jahr]).toArray();
  }

  findByEmployer(employerId: string): Promise<Abgleich[]> {
    return this.db.abgleich.where("employerId").equals(employerId).toArray();
  }

  findByEmployerUndMonatJahr(
    employerId: string,
    monat: number,
    jahr: number,
  ): Promise<Abgleich | undefined> {
    return this.db.abgleich
      .where("[employerId+monat+jahr]")
      .equals([employerId, monat, jahr])
      .first();
  }

  async add(input: AbgleichInput): Promise<Abgleich> {
    const abgleich: Abgleich = { ...input, id: crypto.randomUUID() };
    await this.db.abgleich.add(abgleich);
    return abgleich;
  }

  async update(id: string, changes: AbgleichUpdate): Promise<Abgleich | undefined> {
    await this.db.abgleich.update(id, changes);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.db.abgleich.delete(id);
  }
}
