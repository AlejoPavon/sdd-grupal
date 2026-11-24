import type { Repositorios } from "../../application/ports/repositorios.js";
import { cargarSeed, SEED_IDS } from "../seed.js";
import { InMemoryBloqueoRepository } from "./in-memory-bloqueo-repository.js";
import { InMemoryPacienteRepository } from "./in-memory-paciente-repository.js";
import { InMemoryPrestacionRepository } from "./in-memory-prestacion-repository.js";
import { InMemoryProfesionalRepository } from "./in-memory-profesional-repository.js";
import { InMemorySessionRepository } from "./in-memory-session-repository.js";
import { InMemorySillonRepository } from "./in-memory-sillon-repository.js";
import { InMemoryTurnoRepository } from "./in-memory-turno-repository.js";
import { InMemoryUsuarioRepository } from "./in-memory-usuario-repository.js";
import { crearConexion } from "./sqlite/connection.js";
import { runMigrations } from "./sqlite/migrations.js";
import { SqliteBloqueoRepository } from "./sqlite/sqlite-bloqueo-repository.js";
import { SqlitePacienteRepository } from "./sqlite/sqlite-paciente-repository.js";
import { SqlitePrestacionRepository } from "./sqlite/sqlite-prestacion-repository.js";
import { SqliteProfesionalRepository } from "./sqlite/sqlite-profesional-repository.js";
import { SqliteSillonRepository } from "./sqlite/sqlite-sillon-repository.js";
import { SqliteTurnoRepository } from "./sqlite/sqlite-turno-repository.js";
import { SqliteUsuarioRepository } from "./sqlite/sqlite-usuario-repository.js";

export interface CreateReposConfig {
  persistence?: string;
  databaseUrl?: string;
}

/** Repositorios más una función para cerrar la conexión (no hace nada en memoria). */
export type ReposConCierre = Repositorios & { cerrar: () => void };

export function createRepos(config: CreateReposConfig = {}): ReposConCierre {
  const persistence = config.persistence ?? process.env.PERSISTENCE ?? "memory";
  const databaseUrl = config.databaseUrl ?? process.env.DATABASE_URL ?? "file:./data/turnos.db";

  if (persistence === "sqlite") {
    const db = crearConexion(databaseUrl);
    runMigrations(db);
    return {
      pacientes: new SqlitePacienteRepository(db),
      profesionales: new SqliteProfesionalRepository(db),
      sillones: new SqliteSillonRepository(db),
      prestaciones: new SqlitePrestacionRepository(db),
      turnos: new SqliteTurnoRepository(db),
      usuarios: new SqliteUsuarioRepository(db),
      sesiones: new InMemorySessionRepository(),
      bloqueos: new SqliteBloqueoRepository(db),
      cerrar: () => db.close(),
    };
  }

  return {
    pacientes: new InMemoryPacienteRepository(),
    profesionales: new InMemoryProfesionalRepository(),
    sillones: new InMemorySillonRepository(),
    prestaciones: new InMemoryPrestacionRepository(),
    turnos: new InMemoryTurnoRepository(),
    usuarios: new InMemoryUsuarioRepository(),
    sesiones: new InMemorySessionRepository(),
    bloqueos: new InMemoryBloqueoRepository(),
    cerrar: () => undefined,
  };
}

/** Carga el seed solo si la base está vacía (no existe el admin del seed). Devuelve si cargó. */
export async function seedIfNeeded(repos: Repositorios): Promise<boolean> {
  const existente = await repos.usuarios.buscarPorId(SEED_IDS.admin);
  if (existente) return false;
  await cargarSeed(repos);
  return true;
}