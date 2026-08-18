import type { Employer } from "@/lib/types";
import type {
  EmployerInput,
  EmployerUpdate,
  IEmployerRepository,
} from "../interfaces/IEmployerRepository";
import type { StundenDb } from "./StundenDb";

export class EmployerRepository implements IEmployerRepository {
  constructor(private readonly db: StundenDb) {}

  findById(id: string): Promise<Employer | undefined> {
    return this.db.employers.get(id);
  }

  findAlle(): Promise<Employer[]> {
    return this.db.employers.toArray();
  }

  async findAktive(): Promise<Employer[]> {
    const alle = await this.db.employers.toArray();
    return alle.filter((e) => !e.archiviert);
  }

  async add(input: EmployerInput): Promise<Employer> {
    const employer: Employer = { ...input, id: crypto.randomUUID() };
    await this.db.employers.add(employer);
    return employer;
  }

  async update(id: string, changes: EmployerUpdate): Promise<Employer | undefined> {
    await this.db.employers.update(id, changes);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.db.employers.delete(id);
  }
}
