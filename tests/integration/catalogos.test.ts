import { beforeEach, describe, expect, it } from "vitest";

import { buildServer } from "../../src/http/server.js";
import type { FastifyInstance } from "fastify";
import { InMemoryPacienteRepository } from "../../src/infrastructure/persistence/in-memory-paciente-repository.js";
import { InMemoryPrestacionRepository } from "../../src/infrastructure/persistence/in-memory-prestacion-repository.js";
import { InMemoryProfesionalRepository } from "../../src/infrastructure/persistence/in-memory-profesional-repository.js";
import { InMemorySillonRepository } from "../../src/infrastructure/persistence/in-memory-sillon-repository.js";
import { InMemoryTurnoRepository } from "../../src/infrastructure/persistence/in-memory-turno-repository.js";
import { InMemoryUsuarioRepository } from "../../src/infrastructure/persistence/in-memory-usuario-repository.js";
import { cargarSeed } from "../../src/infrastructure/seed.js";
import type { Repositorios } from "../../src/application/ports/repositorios.js";

describe("GET /api catalogos", () => {
  let app: FastifyInstance;
  beforeEach(async () => {
    const repos: Repositorios = {
      pacientes: new InMemoryPacienteRepository(),
      profesionales: new InMemoryProfesionalRepository(),
      sillones: new InMemorySillonRepository(),
      prestaciones: new InMemoryPrestacionRepository(),
      turnos: new InMemoryTurnoRepository(),
      usuarios: new InMemoryUsuarioRepository(),
    };
    await cargarSeed(repos);
    app = buildServer(repos);
  });

  it("GET /api/profesionales responde 200 con arreglo no vacío", async () => {
    const res = await app.inject({ method: "GET", url: "/api/profesionales" });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
    expect(res.json().length).toBeGreaterThan(0);
  });

  it("GET /api/sillones responde 200 con arreglo no vacío", async () => {
    const res = await app.inject({ method: "GET", url: "/api/sillones" });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
    expect(res.json().length).toBeGreaterThan(0);
  });

  it("GET /api/prestaciones responde 200 con arreglo no vacío", async () => {
    const res = await app.inject({ method: "GET", url: "/api/prestaciones" });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
    expect(res.json().length).toBeGreaterThan(0);
  });
});