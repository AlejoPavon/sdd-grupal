import "dotenv/config";

import { buildServer } from "./http/server.js";
import { InMemoryBloqueoRepository } from "./infrastructure/persistence/in-memory-bloqueo-repository.js";
import { InMemoryPacienteRepository } from "./infrastructure/persistence/in-memory-paciente-repository.js";
import { InMemoryPrestacionRepository } from "./infrastructure/persistence/in-memory-prestacion-repository.js";
import { InMemoryProfesionalRepository } from "./infrastructure/persistence/in-memory-profesional-repository.js";
import { InMemorySessionRepository } from "./infrastructure/persistence/in-memory-session-repository.js";
import { InMemorySillonRepository } from "./infrastructure/persistence/in-memory-sillon-repository.js";
import { InMemoryTurnoRepository } from "./infrastructure/persistence/in-memory-turno-repository.js";
import { InMemoryUsuarioRepository } from "./infrastructure/persistence/in-memory-usuario-repository.js";
import { cargarSeed } from "./infrastructure/seed.js";

const port = Number(process.env.PORT ?? 3000);

const repos = {
  pacientes: new InMemoryPacienteRepository(),
  profesionales: new InMemoryProfesionalRepository(),
  sillones: new InMemorySillonRepository(),
  prestaciones: new InMemoryPrestacionRepository(),
  turnos: new InMemoryTurnoRepository(),
  usuarios: new InMemoryUsuarioRepository(),
  sesiones: new InMemorySessionRepository(),
    bloqueos: new InMemoryBloqueoRepository(),
};

await cargarSeed(repos);

const app = buildServer(repos);

try {
  await app.listen({ port, host: "0.0.0.0" });
} catch (error) {
  console.error(error);
  process.exit(1);
}