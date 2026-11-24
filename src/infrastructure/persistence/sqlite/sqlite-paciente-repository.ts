import type Database from "better-sqlite3";
import type { PacienteRepository } from "../../../application/ports/paciente-repository.js";
import type { Paciente } from "../../../domain/paciente/paciente.js";
import { RecursoNoEncontradoError } from "../../../domain/turno/turno.errors.js";

export class SqlitePacienteRepository implements PacienteRepository {
  constructor(private readonly db: Database.Database) {}

  async crear(paciente: Paciente): Promise<Paciente> {
    this.db
      .prepare(
        `INSERT INTO paciente(id, nombre, apellido, documento, telefono, email, fecha_nacimiento, notas, activo, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        paciente.id,
        paciente.nombre,
        paciente.apellido,
        paciente.documento ?? null,
        paciente.telefono ?? null,
        paciente.email ?? null,
        paciente.fechaNacimiento ? paciente.fechaNacimiento.toISOString() : null,
        paciente.notas ?? null,
        paciente.activo ? 1 : 0,
        paciente.createdAt.getTime(),
        paciente.updatedAt.getTime()
      );
    return paciente;
  }

  async buscarPorId(id: string): Promise<Paciente | undefined> {
    const row = this.db.prepare("SELECT * FROM paciente WHERE id = ?").get(id) as any;
    if (!row) return undefined;
    return map(row);
  }

  async buscarActivoPorId(id: string): Promise<Paciente | undefined> {
    const p = await this.buscarPorId(id);
    return p?.activo ? p : undefined;
  }

  async buscarPorEmailODocumento(criterios: { email?: string; documento?: string }): Promise<Paciente | undefined> {
    const { email, documento } = criterios;
    if (email === undefined && documento === undefined) return undefined;
    const rows = this.db.prepare("SELECT * FROM paciente").all() as any[];
    const found = rows.map(map).find(
      (p) =>
        p.activo &&
        ((email !== undefined && p.email === email) ||
          (documento !== undefined && p.documento === documento))
    );
    return found;
  }

  async listar(q?: string): Promise<Paciente[]> {
    const rows = this.db.prepare("SELECT * FROM paciente WHERE activo = 1").all() as any[];
    const activos = rows.map(map);
    const texto = q?.trim().toLowerCase();
    const filtrados = texto
      ? activos.filter((p) =>
          [p.apellido, p.nombre, p.telefono, p.documento].some((campo) =>
            campo?.toLowerCase().includes(texto)
          )
        )
      : activos;
    return filtrados.sort(
      (a, b) => a.apellido.localeCompare(b.apellido) || a.nombre.localeCompare(b.nombre)
    );
  }

  async actualizar(paciente: Paciente): Promise<Paciente> {
    const exists = this.db.prepare("SELECT id FROM paciente WHERE id = ?").get(paciente.id);
    if (!exists) throw new RecursoNoEncontradoError("paciente", paciente.id);
    this.db
      .prepare(
        `UPDATE paciente SET nombre=?, apellido=?, documento=?, telefono=?, email=?, fecha_nacimiento=?, notas=?, activo=?, updated_at=? WHERE id=?`
      )
      .run(
        paciente.nombre,
        paciente.apellido,
        paciente.documento ?? null,
        paciente.telefono ?? null,
        paciente.email ?? null,
        paciente.fechaNacimiento ? paciente.fechaNacimiento.toISOString() : null,
        paciente.notas ?? null,
        paciente.activo ? 1 : 0,
        paciente.updatedAt.getTime(),
        paciente.id
      );
    return paciente;
  }
}

function map(row: any): Paciente {
  return {
    id: row.id,
    nombre: row.nombre,
    apellido: row.apellido,
    documento: row.documento ?? undefined,
    telefono: row.telefono ?? undefined,
    email: row.email ?? undefined,
    fechaNacimiento: row.fecha_nacimiento ? new Date(row.fecha_nacimiento) : undefined,
    notas: row.notas ?? undefined,
    activo: row.activo === 1,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
