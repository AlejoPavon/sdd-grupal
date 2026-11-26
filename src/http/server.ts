import Fastify, { type FastifyInstance } from "fastify";

import { InMemoryBloqueoRepository } from "../infrastructure/persistence/in-memory-bloqueo-repository.js";
import { InMemoryPacienteRepository } from "../infrastructure/persistence/in-memory-paciente-repository.js";
import { InMemoryPrestacionRepository } from "../infrastructure/persistence/in-memory-prestacion-repository.js";
import { InMemoryProfesionalRepository } from "../infrastructure/persistence/in-memory-profesional-repository.js";
import { InMemorySessionRepository } from "../infrastructure/persistence/in-memory-session-repository.js";
import { InMemorySillonRepository } from "../infrastructure/persistence/in-memory-sillon-repository.js";
import { InMemoryTurnoRepository } from "../infrastructure/persistence/in-memory-turno-repository.js";
import { InMemoryUsuarioRepository } from "../infrastructure/persistence/in-memory-usuario-repository.js";
import type { Repositorios } from "../application/ports/repositorios.js";
import { registrarErrorHandler } from "./error-handler.js";
import { registrarAuthPlugin } from "./plugins/auth.js";
import { registrarFrontend } from "./routes/frontend.js";
import { registrarRutasAuth } from "./routes/auth.js";
import { registrarRutasBloqueos } from "./routes/bloqueos.js";
import { registrarRutasCatalogos } from "./routes/catalogos.js";
import { registrarRutasPacientes } from "./routes/pacientes.js";
import { registrarRutasTurnos } from "./routes/turnos.js";

export const TTL_SESION_DEFAULT_MS = 480 * 60 * 1000;

export interface OpcionesServidor {
  sessionTtlMs?: number;
}

/** Valores inválidos o no positivos usan el default de 480 minutos. */
export function ttlSesionMsDesdeEnv(entorno: NodeJS.ProcessEnv = process.env): number {
  const minutos = Number(entorno.SESSION_TTL_MINUTES);
  if (!Number.isFinite(minutos) || minutos <= 0) return TTL_SESION_DEFAULT_MS;
  return minutos * 60 * 1000;
}

export function buildServer(repos?: Partial<Repositorios>, opciones: OpcionesServidor = {}): FastifyInstance {
  const repositorios: Repositorios = {
    pacientes: new InMemoryPacienteRepository(),
    profesionales: new InMemoryProfesionalRepository(),
    sillones: new InMemorySillonRepository(),
    prestaciones: new InMemoryPrestacionRepository(),
    turnos: new InMemoryTurnoRepository(),
    usuarios: new InMemoryUsuarioRepository(),
    sesiones: new InMemorySessionRepository(),
    bloqueos: new InMemoryBloqueoRepository(),
    ...repos,
  };
  const sessionTtlMs = opciones.sessionTtlMs ?? ttlSesionMsDesdeEnv();

  const app = Fastify();

  app.get("/health", async () => ({ status: "ok" }));

  registrarFrontend(app);
  registrarErrorHandler(app);
  registrarAuthPlugin(app, repositorios);
  registrarRutasAuth(app, repositorios, { sessionTtlMs });
  registrarRutasBloqueos(app, repositorios);
  registrarRutasPacientes(app, repositorios);
  registrarRutasTurnos(app, repositorios);
  registrarRutasCatalogos(app, repositorios);

  return app;
}
