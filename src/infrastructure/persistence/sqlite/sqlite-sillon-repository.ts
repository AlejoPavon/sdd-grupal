import type Database from "better-sqlite3";
import type { SillonRepository } from "../../../application/ports/sillon-repository.js";
import type { Sillon } from "../../../domain/sillon/sillon.js";
import type { SillonRow } from "./row-types.js";

export class SqliteSillonRepository implements SillonRepository {
  constructor(private readonly db: Database.Database) {}

  async crear(sillon: Sillon): Promise<Sillon> {
    this.db
      .prepare(
        "INSERT INTO sillon(id, nombre, sucursal_id, activo) VALUES (?, ?, ?, ?)"
      )
      .run(sillon.id, sillon.nombre, sillon.sucursalId, sillon.activo ? 1 : 0);
    return sillon;
  }

  async buscarPorId(id: string): Promise<Sillon | undefined> {
    const row = this.db
      .prepare("SELECT id, nombre, sucursal_id, activo FROM sillon WHERE id = ?")
      .get(id) as SillonRow;
    if (!row) return undefined;
    return {
      id: row.id,
      nombre: row.nombre,
      sucursalId: row.sucursal_id,
      activo: row.activo === 1,
    };
  }

  async listar(): Promise<Sillon[]> {
    const rows = this.db
      .prepare("SELECT id, nombre, sucursal_id, activo FROM sillon")
      .all() as SillonRow[];
    return rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      sucursalId: r.sucursal_id,
      activo: r.activo === 1,
    }));
  }
}
