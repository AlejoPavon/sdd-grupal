import type Database from "better-sqlite3";
import type { BloqueoRepository, FiltrosBloqueo } from "../../../application/ports/bloqueo-repository.js";
import type { Bloqueo } from "../../../domain/bloqueo/bloqueo.js";
import type { Intervalo } from "../../../domain/turno/intervalo.js";

export class SqliteBloqueoRepository implements BloqueoRepository {
  constructor(private readonly db: Database.Database) {}

  async crear(bloqueo: Bloqueo): Promise<Bloqueo> {
    this.db
      .prepare(
        "INSERT INTO bloqueo(id, profesional_id, sillon_id, inicio, fin, motivo, creado_por, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        bloqueo.id,
        bloqueo.profesionalId ?? null,
        bloqueo.sillonId ?? null,
        bloqueo.inicio.getTime(),
        bloqueo.fin.getTime(),
        bloqueo.motivo,
        bloqueo.creadoPor,
        bloqueo.createdAt.getTime()
      );
    return bloqueo;
  }

  async buscarPorId(id: string): Promise<Bloqueo | undefined> {
    const row = this.db.prepare("SELECT * FROM bloqueo WHERE id = ?").get(id) as any;
    if (!row) return undefined;
    return map(row);
  }

  async listar(filtros?: FiltrosBloqueo): Promise<Bloqueo[]> {
    const rows = this.db.prepare("SELECT * FROM bloqueo").all() as any[];
    let res = rows.map(map);
    if (filtros?.desde) res = res.filter((b) => b.fin > filtros.desde!);
    if (filtros?.hasta) res = res.filter((b) => b.inicio < filtros.hasta!);
    if (filtros?.profesionalId) res = res.filter((b) => b.profesionalId === filtros.profesionalId);
    if (filtros?.sillonId) res = res.filter((b) => b.sillonId === filtros.sillonId);
    return res;
  }

  async buscarSolapadoPorProfesional(profesionalId: string, intervalo: Intervalo): Promise<Bloqueo[]> {
    const rows = this.db
      .prepare("SELECT * FROM bloqueo WHERE profesional_id = ?")
      .all(profesionalId) as any[];
    return rows.map(map).filter((b) =>
      b.inicio.getTime() < intervalo.fin.getTime() && b.fin.getTime() > intervalo.inicio.getTime()
    );
  }

  async buscarSolapadoPorSillon(sillonId: string, intervalo: Intervalo): Promise<Bloqueo[]> {
    const rows = this.db
      .prepare("SELECT * FROM bloqueo WHERE sillon_id = ?")
      .all(sillonId) as any[];
    return rows.map(map).filter((b) =>
      b.inicio.getTime() < intervalo.fin.getTime() && b.fin.getTime() > intervalo.inicio.getTime()
    );
  }

  async eliminar(id: string): Promise<void> {
    this.db.prepare("DELETE FROM bloqueo WHERE id = ?").run(id);
  }
}

function map(row: any): Bloqueo {
  return {
    id: row.id,
    profesionalId: row.profesional_id ?? undefined,
    sillonId: row.sillon_id ?? undefined,
    inicio: new Date(row.inicio),
    fin: new Date(row.fin),
    motivo: row.motivo,
    creadoPor: row.creado_por,
    createdAt: new Date(row.created_at),
  };
}
