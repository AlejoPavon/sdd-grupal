import type Database from "better-sqlite3";
import type { ProfesionalRepository } from "../../../application/ports/profesional-repository.js";
import type { Profesional } from "../../../domain/profesional/profesional.js";
import type { ProfesionalRow } from "./row-types.js";

export class SqliteProfesionalRepository implements ProfesionalRepository {
  constructor(private readonly db: Database.Database) {}

  async crear(profesional: Profesional): Promise<Profesional> {
    this.db
      .prepare(
        "INSERT INTO profesional(id, nombre, apellido, matricula, especialidades, activo) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(
        profesional.id,
        profesional.nombre,
        profesional.apellido,
        profesional.matricula,
        JSON.stringify(profesional.especialidades),
        profesional.activo ? 1 : 0
      );
    return profesional;
  }

  async buscarPorId(id: string): Promise<Profesional | undefined> {
    const row = this.db
      .prepare("SELECT id, nombre, apellido, matricula, especialidades, activo FROM profesional WHERE id = ?")
      .get(id) as ProfesionalRow;
    if (!row) return undefined;
    return {
      id: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      matricula: row.matricula,
      especialidades: JSON.parse(row.especialidades),
      activo: row.activo === 1,
    };
  }

  async listar(): Promise<Profesional[]> {
    const rows = this.db
      .prepare("SELECT id, nombre, apellido, matricula, especialidades, activo FROM profesional")
      .all() as ProfesionalRow[];
    return rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      apellido: r.apellido,
      matricula: r.matricula,
      especialidades: JSON.parse(r.especialidades),
      activo: r.activo === 1,
    }));
  }
}
