import type Database from "better-sqlite3";
import type { UsuarioRepository } from "../../../application/ports/usuario-repository.js";
import type { Usuario } from "../../../domain/usuario/usuario.js";
import type { UsuarioRow } from "./row-types.js";

export class SqliteUsuarioRepository implements UsuarioRepository {
  constructor(private readonly db: Database.Database) {}

  async crear(usuario: Usuario): Promise<Usuario> {
    this.db
      .prepare(
        "INSERT INTO usuario(id, email, password_hash, nombre, apellido, rol, profesional_id, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        usuario.id,
        usuario.email,
        usuario.passwordHash,
        usuario.nombre,
        usuario.apellido,
        usuario.rol,
        usuario.profesionalId ?? null,
        usuario.activo ? 1 : 0
      );
    return usuario;
  }

  async buscarPorId(id: string): Promise<Usuario | undefined> {
    const row = this.db
      .prepare("SELECT id, email, password_hash, nombre, apellido, rol, profesional_id, activo FROM usuario WHERE id = ?")
      .get(id) as UsuarioRow;
    if (!row) return undefined;
    return map(row);
  }

  async buscarPorEmail(email: string): Promise<Usuario | undefined> {
    const row = this.db
      .prepare("SELECT id, email, password_hash, nombre, apellido, rol, profesional_id, activo FROM usuario WHERE lower(trim(email)) = lower(trim(?))")
      .get(email) as UsuarioRow;
    if (!row) return undefined;
    return map(row);
  }

  async listar(): Promise<Usuario[]> {
    const rows = this.db
      .prepare("SELECT id, email, password_hash, nombre, apellido, rol, profesional_id, activo FROM usuario")
      .all() as UsuarioRow[];
    return rows.map(map);
  }
}

function map(row: UsuarioRow): Usuario {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    nombre: row.nombre,
    apellido: row.apellido,
    rol: row.rol,
    activo: row.activo === 1,
    profesionalId: row.profesional_id ?? undefined,
  };
}
