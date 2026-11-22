import type { Profesional } from "../../domain/profesional/profesional.js";

export interface ProfesionalRepository {
  crear(profesional: Profesional): Promise<Profesional>;
  buscarPorId(id: string): Promise<Profesional | undefined>;
  listar(): Promise<Profesional[]>;
}