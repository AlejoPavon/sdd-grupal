import { beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { buildServer } from "../../src/http/server.js";
import type { FastifyInstance } from "fastify";
import { InMemoryPacienteRepository } from "../../src/infrastructure/persistence/in-memory-paciente-repository.js";
import { InMemoryPrestacionRepository } from "../../src/infrastructure/persistence/in-memory-prestacion-repository.js";
import { InMemoryProfesionalRepository } from "../../src/infrastructure/persistence/in-memory-profesional-repository.js";
import { InMemorySillonRepository } from "../../src/infrastructure/persistence/in-memory-sillon-repository.js";
import { InMemoryTurnoRepository } from "../../src/infrastructure/persistence/in-memory-turno-repository.js";
import { InMemoryUsuarioRepository } from "../../src/infrastructure/persistence/in-memory-usuario-repository.js";
import { cargarSeed, SEED_IDS } from "../../src/infrastructure/seed.js";
import type { Repositorios } from "../../src/application/ports/repositorios.js";

// Nota: no existe barrel index; importar directamente si falla.
describe("POST /api/turnos", () => {
  let app: FastifyInstance;
  let repos: Repositorios;

  beforeEach(async () => {
    repos = {
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

  const baseBody = () => ({
    pacienteId: SEED_IDS.paciente1,
    profesionalId: SEED_IDS.profesional1,
    sillonId: SEED_IDS.sillon1,
    prestacionId: SEED_IDS.consulta,
    inicio: "2026-11-18T09:00:00.000Z",
  });

  it("crea un turno válido y responde 201", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/turnos",
      payload: baseBody(),
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.estado).toBe("pendiente");
    expect(body.id).toBeTruthy();
    expect(body.inicio).toBe("2026-11-18T09:00:00.000Z");
    expect(body.fin).toBe("2026-11-18T09:30:00.000Z");
  });

  it("rechaza solapamiento por profesional con 409", async () => {
    await app.inject({ method: "POST", url: "/api/turnos", payload: baseBody() });

    const segundo = {
      ...baseBody(),
      pacienteId: SEED_IDS.paciente2,
      sillonId: SEED_IDS.sillon2,
      inicio: "2026-11-18T09:15:00.000Z",
    };
    const response = await app.inject({ method: "POST", url: "/api/turnos", payload: segundo });

    expect(response.statusCode).toBe(409);
    const body = response.json();
    expect(body.code).toBe("TURNO_SOLAPADO_PROFESIONAL");
    expect(body.details.turnoEnConflicto.id).toBeTruthy();
  });

  it("rechaza solapamiento por sillón con 409", async () => {
    await app.inject({ method: "POST", url: "/api/turnos", payload: baseBody() });

    const segundo = {
      ...baseBody(),
      pacienteId: SEED_IDS.paciente2,
      profesionalId: SEED_IDS.profesional2,
      inicio: "2026-11-18T09:15:00.000Z",
    };
    const response = await app.inject({ method: "POST", url: "/api/turnos", payload: segundo });

    expect(response.statusCode).toBe(409);
    const body = response.json();
    expect(body.code).toBe("TURNO_SOLAPADO_SILLON");
  });

  it("permite turnos contiguos", async () => {
    const r1 = await app.inject({ method: "POST", url: "/api/turnos", payload: baseBody() });
    expect(r1.statusCode).toBe(201);

    const segundo = { ...baseBody(), pacienteId: SEED_IDS.paciente2, inicio: "2026-11-18T09:30:00.000Z" };
    const r2 = await app.inject({ method: "POST", url: "/api/turnos", payload: segundo });
    expect(r2.statusCode).toBe(201);
  });

  it("rechaza recurso inactivo con 409 RECURSO_INACTIVO", async () => {
    const idInactivo = "00000000-0000-4000-8000-000000000099";
    await repos.profesionales.crear({
      id: idInactivo,
      nombre: "Inactivo",
      apellido: "Demo",
      matricula: "INACTIVO",
      especialidades: [],
      activo: false,
    });

    const body = { ...baseBody(), profesionalId: idInactivo };
    const response = await app.inject({ method: "POST", url: "/api/turnos", payload: body });

    expect(response.statusCode).toBe(409);
    expect(response.json().code).toBe("RECURSO_INACTIVO");
  });

  it("rechaza recurso inexistente con 404", async () => {
    const body = { ...baseBody(), pacienteId: randomUUID() };
    const response = await app.inject({ method: "POST", url: "/api/turnos", payload: body });

    expect(response.statusCode).toBe(404);
    expect(response.json().code).toBe("PACIENTE_NO_ENCONTRADO");
  });

  it("rechaza intervalo inválido con 400 TURNO_INTERVALO_INVALIDO", async () => {
    const idCero = "00000000-0000-4000-8000-000000000098";
    await repos.prestaciones.crear({
      id: idCero,
      codigo: "CERO",
      nombre: "Cero",
      duracionMinutos: 0,
      activo: true,
    });

    const body = { ...baseBody(), prestacionId: idCero };
    const response = await app.inject({ method: "POST", url: "/api/turnos", payload: body });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe("TURNO_INTERVALO_INVALIDO");
  });

  it("validación: campo faltante responde 400", async () => {
    const { pacienteId: _, ...rest } = baseBody();
    void _;
    const response = await app.inject({ method: "POST", url: "/api/turnos", payload: rest });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.code).toBe("VALIDACION_FALLIDA");
    expect(body.details.pacienteId).toBeTruthy();
  });

  it("validación: fecha inválida responde 400", async () => {
    const body = { ...baseBody(), inicio: "no-es-fecha" };
    const response = await app.inject({ method: "POST", url: "/api/turnos", payload: body });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe("VALIDACION_FALLIDA");
    expect(response.json().details.inicio).toBeTruthy();
  });

  it("no persiste turno en solapamiento profesional", async () => {
    await app.inject({ method: "POST", url: "/api/turnos", payload: baseBody() });
    const segundo = {
      ...baseBody(),
      pacienteId: SEED_IDS.paciente2,
      sillonId: SEED_IDS.sillon2,
      inicio: "2026-11-18T09:15:00.000Z",
    };
    await app.inject({ method: "POST", url: "/api/turnos", payload: segundo });
    const turnos = await repos.turnos.listar();
    expect(turnos).toHaveLength(1);
  });
});