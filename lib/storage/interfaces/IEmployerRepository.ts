import type { Employer } from "@/lib/types";

export type EmployerInput = Omit<Employer, "id">;
export type EmployerUpdate = Partial<EmployerInput>;

export interface IEmployerRepository {
  findById(id: string): Promise<Employer | undefined>;
  findAlle(): Promise<Employer[]>;
  findAktive(): Promise<Employer[]>;
  add(input: EmployerInput): Promise<Employer>;
  update(id: string, changes: EmployerUpdate): Promise<Employer | undefined>;
  remove(id: string): Promise<void>;
}
