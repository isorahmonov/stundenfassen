import type { Abgleich } from "@/lib/types";

export type AbgleichInput = Omit<Abgleich, "id">;
export type AbgleichUpdate = Partial<AbgleichInput>;

export interface IAbgleichRepository {
  findById(id: string): Promise<Abgleich | undefined>;
  findByMonatJahr(monat: number, jahr: number): Promise<Abgleich[]>;
  findByEmployer(employerId: string): Promise<Abgleich[]>;
  findByEmployerUndMonatJahr(
    employerId: string,
    monat: number,
    jahr: number,
  ): Promise<Abgleich | undefined>;
  add(input: AbgleichInput): Promise<Abgleich>;
  update(id: string, changes: AbgleichUpdate): Promise<Abgleich | undefined>;
  remove(id: string): Promise<void>;
}
