import Fastify, { type FastifyInstance } from "fastify";

import { InMemoryPacienteRepository } from "../infrastructure/persistence/in-memory-paciente-repository.js";
import { InMemoryPrestacionRepository } from "../infrastructure/persistence/in-memory-prestacion-repository.js";
import { InMemoryProfesionalRepository } from "../infrastructure/persistence/in-memory-profesional-repository.js";
import { InMemorySillonRepository } from "../infrastructure/persistence/in-memory-sillon-repository.js";
import { InMemoryTurnoRepository } from "../infrastructure/persistence/in-memory-turno-repository.js";
import { InMemoryUsuarioRepository } from "../infrastructure/persistence/in-memory-usuario-repository.js";
import type { Repositorios } from "../application/ports/repositorios.js";
import { registrarErrorHandler } from "./error-handler.js";
import { registrarRutasPacientes } from "./routes/pacientes.js";
import { registrarRutasTurnos } from "./routes/turnos.js";

export function buildServer(repos?: Repositorios): FastifyInstance {
  const repositorios: Repositorios = repos ?? {
    pacientes: new InMemoryPacienteRepository(),
    profesionales: new InMemoryProfesionalRepository(),
    sillones: new InMemorySillonRepository(),
    prestaciones: new InMemoryPrestacionRepository(),
    turnos: new InMemoryTurnoRepository(),
    usuarios: new InMemoryUsuarioRepository(),
  };

  const app = Fastify();

  app.get("/health", async () => ({ status: "ok" }));

  registrarErrorHandler(app);
  registrarRutasPacientes(app, repositorios);
  registrarRutasTurnos(app, repositorios);

  return app;
}