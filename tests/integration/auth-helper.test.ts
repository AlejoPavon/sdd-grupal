import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { autenticarseComo } from "../helpers/auth.js";
import { buildServer } from "../../src/http/server.js";
import type { Repositorios } from "../../src/application/ports/repositorios.js";
import { InMemoryPacienteRepository } from "../../src/infrastructure/persistence/in-memory-paciente-repository.js";
import { InMemoryPrestacionRepository } from "../../src/infrastructure/persistence/in-memory-prestacion-repository.js";
import { InMemoryProfesionalRepository } from "../../src/infrastructure/persistence/in-memory-profesional-repository.js";
import { InMemoryBloqueoRepository } from "../../src/infrastructure/persistence/in-memory-bloqueo-repository.js";
import { InMemorySessionRepository } from "../../src/infrastructure/persistence/in-memory-session-repository.js";
import { InMemorySillonRepository } from "../../src/infrastructure/persistence/in-memory-sillon-repository.js";
import { InMemoryTurnoRepository } from "../../src/infrastructure/persistence/in-memory-turno-repository.js";
import { InMemoryUsuarioRepository } from "../../src/infrastructure/persistence/in-memory-usuario-repository.js";
import { cargarSeed } from "../../src/infrastructure/seed.js";

const apps: FastifyInstance[] = [];

afterEach(async () => {
  for (const app of apps.splice(0)) await app.close();
});

describe("helper de autenticación de tests", () => {
  it("autenticarseComo devuelve una cookie válida para los tres roles demo", async () => {
    const repos: Repositorios = {
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
    apps.push(app);

    for (const rol of ["administrador", "recepcionista", "profesional"] as const) {
      const { headers, usuario } = await autenticarseComo(app, rol);

      const autenticado = await app.inject({ method: "GET", url: "/api/auth/me", headers });
      expect(autenticado.statusCode).toBe(200);
      expect(autenticado.json().rol).toBe(rol);
      expect(usuario.rol).toBe(rol);
    }
  });

  it("sin la cookie del helper la ruta responde 401", async () => {
    const app = buildServer();
    apps.push(app);

    const response = await app.inject({ method: "GET", url: "/api/auth/me" });

    expect(response.statusCode).toBe(401);
  });
});
