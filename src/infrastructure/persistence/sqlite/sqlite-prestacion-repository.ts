import type Database from "better-sqlite3";
import type { PrestacionRepository } from "../../../application/ports/prestacion-repository.js";
import type { Prestacion } from "../../../domain/prestacion/prestacion.js";
import type { PrestacionRow } from "./row-types.js";

export class SqlitePrestacionRepository implements PrestacionRepository {
  constructor(private readonly db: Database.Database) {}

  async crear(prestacion: Prestacion): Promise<Prestacion> {
    this.db
      .prepare(
        "INSERT INTO prestacion(id, codigo, nombre, duracion_minutos, precio, activo) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(
        prestacion.id,
        prestacion.codigo,
        prestacion.nombre,
        prestacion.duracionMinutos,
        prestacion.precio ?? null,
        prestacion.activo ? 1 : 0
      );
    return prestacion;
  }

  async buscarPorId(id: string): Promise<Prestacion | undefined> {
    const row = this.db
      .prepare("SELECT id, codigo, nombre, duracion_minutos, precio, activo FROM prestacion WHERE id = ?")
      .get(id) as PrestacionRow;
    if (!row) return undefined;
    return {
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      duracionMinutos: row.duracion_minutos,
      precio: row.precio === null ? undefined : row.precio,
      activo: row.activo === 1,
    };
  }

  async listar(): Promise<Prestacion[]> {
    const rows = this.db
      .prepare("SELECT id, codigo, nombre, duracion_minutos, precio, activo FROM prestacion")
      .all() as PrestacionRow[];
    return rows.map((r) => ({
      id: r.id,
      codigo: r.codigo,
      nombre: r.nombre,
      duracionMinutos: r.duracion_minutos,
      precio: r.precio === null ? undefined : r.precio,
      activo: r.activo === 1,
    }));
  }
}
