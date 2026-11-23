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

describe("GET /api/turnos", () => {
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

  async function crearTurno(body: Record<string, unknown>) {
    return app.inject({ method: "POST", url: "/api/turnos", payload: body });
  }

  const baseBody = () => ({
    pacienteId: SEED_IDS.paciente1,
    profesionalId: SEED_IDS.profesional1,
    sillonId: SEED_IDS.sillon1,
    prestacionId: SEED_IDS.consulta,
    inicio: "2026-11-18T09:00:00.000Z",
  });

  it("lista turnos por rango, ordenados por inicio", async () => {
    await crearTurno(baseBody());
    await crearTurno({ ...baseBody(), pacienteId: SEED_IDS.paciente2, inicio: "2026-11-18T11:00:00.000Z" });

    const res = await app.inject({
      method: "GET",
      url: "/api/turnos?desde=2026-11-18T08:00:00.000Z&hasta=2026-11-18T12:00:00.000Z",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(2);
    expect(new Date(body[0].inicio).getTime()).toBeLessThan(new Date(body[1].inicio).getTime());
  });

  it("filtra combinado por profesional y sillón", async () => {
    await crearTurno(baseBody());
    const segundo = {
      pacienteId: SEED_IDS.paciente2,
      profesionalId: SEED_IDS.profesional2,
      sillonId: SEED_IDS.sillon2,
      prestacionId: SEED_IDS.consulta,
      inicio: "2026-11-18T09:00:00.000Z",
    };
    await crearTurno(segundo);

    const res = await app.inject({
      method: "GET",
      url: `/api/turnos?profesionalId=${SEED_IDS.profesional1}&sillonId=${SEED_IDS.sillon1}`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(1);
    expect(body[0].profesionalId).toBe(SEED_IDS.profesional1);
    expect(body[0].sillonId).toBe(SEED_IDS.sillon1);
  });

  it("rango inválido responde 400 RANGO_INVALIDO", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/turnos?desde=2026-11-18T12:00:00.000Z&hasta=2026-11-18T08:00:00.000Z",
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("RANGO_INVALIDO");
  });

  it("excluye turnos cancelados", async () => {
    const r = await crearTurno(baseBody());
    const id = r.json().id;
    const turno = await repos.turnos.buscarPorId(id);
    await repos.turnos.actualizar({ ...turno!, estado: "cancelado" });

    const res = await app.inject({
      method: "GET",
      url: "/api/turnos?desde=2026-11-18T08:00:00.000Z&hasta=2026-11-18T12:00:00.000Z",
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(0);
  });

  it("enriquece respuesta con paciente y prestacion", async () => {
    await crearTurno(baseBody());
    const res = await app.inject({
      method: "GET",
      url: "/api/turnos?desde=2026-11-18T08:00:00.000Z&hasta=2026-11-18T12:00:00.000Z",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body[0].paciente).toMatchObject({ id: SEED_IDS.paciente1, nombre: "Paciente", apellido: "Demo Uno" });
    expect(body[0].prestacion).toMatchObject({ id: SEED_IDS.consulta, codigo: "CONSULTA", nombre: "Consulta", duracionMinutos: 30 });
  });

  it("GET /api/turnos/:id existente responde 200", async () => {
    const r = await crearTurno(baseBody());
    const id = r.json().id;
    const res = await app.inject({ method: "GET", url: `/api/turnos/${id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(id);
  });

  it("GET /api/turnos/:id inexistente responde 404 TURNO_NO_ENCONTRADO", async () => {
    const res = await app.inject({ method: "GET", url: "/api/turnos/00000000-0000-4000-8000-000000000099" });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe("TURNO_NO_ENCONTRADO");
  });
});