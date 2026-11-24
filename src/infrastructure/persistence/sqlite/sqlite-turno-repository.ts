import type Database from "better-sqlite3";
import type { TurnoRepository, FiltrosTurno } from "../../../application/ports/turno-repository.js";
import type { Turno } from "../../../domain/turno/turno.js";
import type { Intervalo } from "../../../domain/turno/intervalo.js";
import { TurnoSolapadoError, RecursoNoEncontradoError } from "../../../domain/turno/turno.errors.js";
import { ocupaAgenda } from "../../../domain/turno/estado-turno.js";

export class SqliteTurnoRepository implements TurnoRepository {
  constructor(private readonly db: Database.Database) {}

  async crear(turno: Turno): Promise<Turno> {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      if (!turno.esSobreturno) {
        const conflict = this.buscarSolapadosSync("profesional_id", turno.profesionalId, turno.inicio, turno.fin)
          .find((t) => ocupaAgenda(t.estado));
        if (conflict) throw new TurnoSolapadoError("profesional", conflict);
      }
      const conflictSillon = this.buscarSolapadosSync("sillon_id", turno.sillonId, turno.inicio, turno.fin)
        .find((t) => ocupaAgenda(t.estado));
      if (conflictSillon) throw new TurnoSolapadoError("sillon", conflictSillon);

      this.db
        .prepare(
          `INSERT INTO turno(id, paciente_id, profesional_id, sillon_id, prestacion_id, inicio, fin, estado, es_sobreturno, notas, autorizado_por, created_by, created_at, updated_at, cancelled_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        )
        .run(
          turno.id,
          turno.pacienteId,
          turno.profesionalId,
          turno.sillonId,
          turno.prestacionId,
          turno.inicio.getTime(),
          turno.fin.getTime(),
          turno.estado,
          turno.esSobreturno ? 1 : 0,
          turno.notas ?? null,
          turno.autorizadoPor ?? null,
          turno.createdBy,
          turno.createdAt.getTime(),
          turno.updatedAt.getTime(),
          turno.cancelledAt ? turno.cancelledAt.getTime() : null
        );
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
    return turno;
  }

  private buscarSolapadosSync(column: string, value: string, inicio: Date, fin: Date): Turno[] {
    const rows = this.db
      .prepare(`SELECT * FROM turno WHERE ${column} = ?`)
      .all(value) as any[];
    return rows
      .map(map)
      .filter((t) => t.inicio.getTime() < fin.getTime() && t.fin.getTime() > inicio.getTime());
  }

  async buscarPorId(id: string): Promise<Turno | undefined> {
    const row = this.db.prepare("SELECT * FROM turno WHERE id = ?").get(id) as any;
    if (!row) return undefined;
    return map(row);
  }

  async listar(filtros?: FiltrosTurno): Promise<Turno[]> {
    const rows = this.db.prepare("SELECT * FROM turno").all() as any[];
    let res = rows.map(map);
    if (filtros?.profesionalId) res = res.filter((t) => t.profesionalId === filtros.profesionalId);
    if (filtros?.sillonId) res = res.filter((t) => t.sillonId === filtros.sillonId);
    if (filtros?.desde) res = res.filter((t) => t.fin.getTime() > filtros.desde!.getTime());
    if (filtros?.hasta) res = res.filter((t) => t.inicio.getTime() < filtros.hasta!.getTime());
    if (filtros?.estados?.length) res = res.filter((t) => filtros.estados!.includes(t.estado));
    return res.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  }

  async buscarSolapadoPorProfesional(profesionalId: string, intervalo: Intervalo, excluirId?: string): Promise<Turno[]> {
    const rows = this.db.prepare("SELECT * FROM turno WHERE profesional_id = ?").all(profesionalId) as any[];
    return rows
      .map(map)
      .filter((t) => t.inicio.getTime() < intervalo.fin.getTime() && t.fin.getTime() > intervalo.inicio.getTime())
      .filter((t) => (excluirId ? t.id !== excluirId : true));
  }

  async buscarSolapadoPorSillon(sillonId: string, intervalo: Intervalo, excluirId?: string): Promise<Turno[]> {
    const rows = this.db.prepare("SELECT * FROM turno WHERE sillon_id = ?").all(sillonId) as any[];
    return rows
      .map(map)
      .filter((t) => t.inicio.getTime() < intervalo.fin.getTime() && t.fin.getTime() > intervalo.inicio.getTime())
      .filter((t) => (excluirId ? t.id !== excluirId : true));
  }

  async actualizar(turno: Turno): Promise<Turno> {
    const exists = this.db.prepare("SELECT id FROM turno WHERE id = ?").get(turno.id);
    if (!exists) throw new RecursoNoEncontradoError("turno", turno.id);
    this.db
      .prepare(
        `UPDATE turno SET paciente_id=?, profesional_id=?, sillon_id=?, prestacion_id=?, inicio=?, fin=?, estado=?, es_sobreturno=?, notas=?, autorizado_por=?, updated_at=?, cancelled_at=? WHERE id=?`
      )
      .run(
        turno.pacienteId,
        turno.profesionalId,
        turno.sillonId,
        turno.prestacionId,
        turno.inicio.getTime(),
        turno.fin.getTime(),
        turno.estado,
        turno.esSobreturno ? 1 : 0,
        turno.notas ?? null,
        turno.autorizadoPor ?? null,
        turno.updatedAt.getTime(),
        turno.cancelledAt ? turno.cancelledAt.getTime() : null,
        turno.id
      );
    return turno;
  }
}

function map(row: any): Turno {
  return {
    id: row.id,
    pacienteId: row.paciente_id,
    profesionalId: row.profesional_id,
    sillonId: row.sillon_id,
    prestacionId: row.prestacion_id,
    inicio: new Date(row.inicio),
    fin: new Date(row.fin),
    estado: row.estado,
    esSobreturno: row.es_sobreturno === 1,
    notas: row.notas ?? undefined,
    createdBy: row.created_by,
    autorizadoPor: row.autorizado_por ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
  };
}
