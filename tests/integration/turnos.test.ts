import { beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { crearBloqueo } from "../../src/domain/bloqueo/bloqueo.js";
import { buildServer } from "../../src/http/server.js";
import type { FastifyInstance } from "fastify";
import { InMemoryPacienteRepository } from "../../src/infrastructure/persistence/in-memory-paciente-repository.js";
import { InMemoryPrestacionRepository } from "../../src/infrastructure/persistence/in-memory-prestacion-repository.js";
import { InMemoryProfesionalRepository } from "../../src/infrastructure/persistence/in-memory-profesional-repository.js";
import { InMemorySillonRepository } from "../../src/infrastructure/persistence/in-memory-sillon-repository.js";
import { InMemoryTurnoRepository } from "../../src/infrastructure/persistence/in-memory-turno-repository.js";
import { InMemoryUsuarioRepository } from "../../src/infrastructure/persistence/in-memory-usuario-repository.js";
import { InMemoryBloqueoRepository } from "../../src/infrastructure/persistence/in-memory-bloqueo-repository.js";
import { InMemorySessionRepository } from "../../src/infrastructure/persistence/in-memory-session-repository.js";
import { autenticarseComo, type SesionDeTest } from "../helpers/auth.js";
import { cargarSeed, SEED_IDS } from "../../src/infrastructure/seed.js";
import type { Repositorios } from "../../src/application/ports/repositorios.js";

// Nota: no existe barrel index; importar directamente si falla.
describe("POST /api/turnos", () => {
  let app: FastifyInstance;
  let repos: Repositorios;
  let sesion: SesionDeTest;

  beforeEach(async () => {
    repos = {
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
    app = buildServer(repos);
    sesion = await autenticarseComo(app, "recepcionista");
  });

  const baseBody = () => ({
    pacienteId: SEED_IDS.paciente1,
    profesionalId: SEED_IDS.profesional1,
    sillonId: SEED_IDS.sillon1,
    prestacionId: SEED_IDS.consulta,
    inicio: "2027-01-15T09:00:00.000Z",
  });

  it("crea un turno válido y responde 201", async () => {
    const response = await app.inject({
      headers: sesion.headers,
      method: "POST",
      url: "/api/turnos",
      payload: baseBody(),
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.estado).toBe("pendiente");
    expect(body.id).toBeTruthy();
    expect(body.inicio).toBe("2027-01-15T09:00:00.000Z");
    expect(body.fin).toBe("2027-01-15T09:30:00.000Z");
  });

  it("un profesional distinto en un sillón libre crea el turno sin conflicto", async () => {
    expect((await app.inject({
      headers: sesion.headers,
      method: "POST",
      url: "/api/turnos",
      payload: baseBody(),
    })).statusCode).toBe(201);

    const response = await app.inject({
      headers: sesion.headers,
      method: "POST",
      url: "/api/turnos",
      payload: { ...baseBody(), profesionalId: SEED_IDS.profesional2, sillonId: SEED_IDS.sillon2 },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      profesionalId: SEED_IDS.profesional2,
      sillonId: SEED_IDS.sillon2,
    });
    expect(await repos.turnos.listar()).toHaveLength(2);
  });

  it("rechaza solapamiento por profesional con 409", async () => {
    await app.inject({ headers: sesion.headers, method: "POST", url: "/api/turnos", payload: baseBody() });

    const segundo = {
      ...baseBody(),
      pacienteId: SEED_IDS.paciente2,
      sillonId: SEED_IDS.sillon2,
      inicio: "2027-01-15T09:15:00.000Z",
    };
    const response = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/turnos", payload: segundo });

    expect(response.statusCode).toBe(409);
    const body = response.json();
    expect(body.code).toBe("TURNO_SOLAPADO_PROFESIONAL");
    expect(body.details.turnoEnConflicto.id).toBeTruthy();
  });

  it("rechaza solapamiento por sillón con 409", async () => {
    await app.inject({ headers: sesion.headers, method: "POST", url: "/api/turnos", payload: baseBody() });

    const segundo = {
      ...baseBody(),
      pacienteId: SEED_IDS.paciente2,
      profesionalId: SEED_IDS.profesional2,
      inicio: "2027-01-15T09:15:00.000Z",
    };
    const response = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/turnos", payload: segundo });

    expect(response.statusCode).toBe(409);
    const body = response.json();
    expect(body.code).toBe("TURNO_SOLAPADO_SILLON");
  });

  it("permite turnos contiguos", async () => {
    const r1 = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/turnos", payload: baseBody() });
    expect(r1.statusCode).toBe(201);

    const segundo = { ...baseBody(), pacienteId: SEED_IDS.paciente2, inicio: "2027-01-15T09:30:00.000Z" };
    const r2 = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/turnos", payload: segundo });
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
    const response = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/turnos", payload: body });

    expect(response.statusCode).toBe(409);
    expect(response.json().code).toBe("RECURSO_INACTIVO");
  });

  it("rechaza recurso inexistente con 404", async () => {
    const body = { ...baseBody(), pacienteId: randomUUID() };
    const response = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/turnos", payload: body });

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
    const response = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/turnos", payload: body });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe("TURNO_INTERVALO_INVALIDO");
  });

  it("rechaza un turno en el pasado con 400 TURNO_EN_EL_PASADO", async () => {
    const body = { ...baseBody(), inicio: "2020-01-01T09:00:00.000Z" };
    const response = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/turnos", payload: body });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe("TURNO_EN_EL_PASADO");
  });

  it("validación: campo faltante responde 400", async () => {
    const { pacienteId: _, ...rest } = baseBody();
    void _;
    const response = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/turnos", payload: rest });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.code).toBe("VALIDACION_FALLIDA");
    expect(body.details.pacienteId).toBeTruthy();
  });

  it("validación: fecha inválida responde 400", async () => {
    const body = { ...baseBody(), inicio: "no-es-fecha" };
    const response = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/turnos", payload: body });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe("VALIDACION_FALLIDA");
    expect(response.json().details.inicio).toBeTruthy();
  });

  it("no persiste turno en solapamiento profesional", async () => {
    await app.inject({ headers: sesion.headers, method: "POST", url: "/api/turnos", payload: baseBody() });
    const segundo = {
      ...baseBody(),
      pacienteId: SEED_IDS.paciente2,
      sillonId: SEED_IDS.sillon2,
      inicio: "2027-01-15T09:15:00.000Z",
    };
    await app.inject({ headers: sesion.headers, method: "POST", url: "/api/turnos", payload: segundo });
    const turnos = await repos.turnos.listar();
    expect(turnos).toHaveLength(1);
  });
});

describe("GET /api/turnos", () => {
  let app: FastifyInstance;
  let repos: Repositorios;
  let sesion: SesionDeTest;

  beforeEach(async () => {
    repos = {
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
    app = buildServer(repos);
    sesion = await autenticarseComo(app, "recepcionista");
  });

  async function crearTurno(body: Record<string, unknown>) {
    return app.inject({ headers: sesion.headers, method: "POST", url: "/api/turnos", payload: body });
  }

  const baseBody = () => ({
    pacienteId: SEED_IDS.paciente1,
    profesionalId: SEED_IDS.profesional1,
    sillonId: SEED_IDS.sillon1,
    prestacionId: SEED_IDS.consulta,
    inicio: "2027-01-15T09:00:00.000Z",
  });

  it("lista turnos por rango, ordenados por inicio", async () => {
    await crearTurno(baseBody());
    await crearTurno({ ...baseBody(), pacienteId: SEED_IDS.paciente2, inicio: "2027-01-15T11:00:00.000Z" });

    const res = await app.inject({
      headers: sesion.headers,
      method: "GET",
      url: "/api/turnos?desde=2027-01-15T08:00:00.000Z&hasta=2027-01-15T12:00:00.000Z",
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
      inicio: "2027-01-15T09:00:00.000Z",
    };
    await crearTurno(segundo);

    const res = await app.inject({
      headers: sesion.headers,
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
      headers: sesion.headers,
      method: "GET",
      url: "/api/turnos?desde=2027-01-15T12:00:00.000Z&hasta=2027-01-15T08:00:00.000Z",
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
      headers: sesion.headers,
      method: "GET",
      url: "/api/turnos?desde=2027-01-15T08:00:00.000Z&hasta=2027-01-15T12:00:00.000Z",
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(0);
  });

  it("enriquece respuesta con paciente y prestacion", async () => {
    await crearTurno(baseBody());
    const res = await app.inject({
      headers: sesion.headers,
      method: "GET",
      url: "/api/turnos?desde=2027-01-15T08:00:00.000Z&hasta=2027-01-15T12:00:00.000Z",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body[0].paciente).toMatchObject({ id: SEED_IDS.paciente1, nombre: "Paciente", apellido: "Demo Uno" });
    expect(body[0].prestacion).toMatchObject({ id: SEED_IDS.consulta, codigo: "CONSULTA", nombre: "Consulta", duracionMinutos: 30 });
  });

  it("GET /api/turnos/:id existente responde 200", async () => {
    const r = await crearTurno(baseBody());
    const id = r.json().id;
    const res = await app.inject({ headers: sesion.headers, method: "GET", url: `/api/turnos/${id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(id);
  });

  it("GET /api/turnos/:id inexistente responde 404 TURNO_NO_ENCONTRADO", async () => {
    const res = await app.inject({ headers: sesion.headers, method: "GET", url: "/api/turnos/00000000-0000-4000-8000-000000000099" });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe("TURNO_NO_ENCONTRADO");
  });
});

describe("PATCH /api/turnos/:id/cancelar", () => {
  let app: FastifyInstance;
  let repos: Repositorios;
  let sesion: SesionDeTest;

  beforeEach(async () => {
    repos = {
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
    app = buildServer(repos);
    sesion = await autenticarseComo(app, "recepcionista");
  });

  const baseBody = () => ({
    pacienteId: SEED_IDS.paciente1,
    profesionalId: SEED_IDS.profesional1,
    sillonId: SEED_IDS.sillon1,
    prestacionId: SEED_IDS.consulta,
    inicio: "2027-01-15T09:00:00.000Z",
  });

  async function crearTurno() {
    const r = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/turnos", payload: baseBody() });
    return r.json().id as string;
  }

  it("cancela un turno pendiente y responde 200 con cancelledAt", async () => {
    const id = await crearTurno();
    const res = await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/turnos/${id}/cancelar` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.estado).toBe("cancelado");
    expect(body.cancelledAt).toBeTruthy();
    expect(body.updatedAt).toBeTruthy();
  });

  it("cancela un turno confirmado", async () => {
    const id = await crearTurno();
    const turno = await repos.turnos.buscarPorId(id);
    await repos.turnos.actualizar({ ...turno!, estado: "confirmado" });

    const res = await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/turnos/${id}/cancelar` });
    expect(res.statusCode).toBe(200);
    expect(res.json().estado).toBe("cancelado");
  });

  it("doble cancelación es idempotente: no cambia cancelledAt/updatedAt", async () => {
    const id = await crearTurno();
    const r1 = await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/turnos/${id}/cancelar` });
    const primera = r1.json();
    const r2 = await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/turnos/${id}/cancelar` });
    const segunda = r2.json();

    expect(r2.statusCode).toBe(200);
    expect(segunda.estado).toBe("cancelado");
    expect(segunda.cancelledAt).toBe(primera.cancelledAt);
    expect(segunda.updatedAt).toBe(primera.updatedAt);
  });

  it("turno atendido responde 409 TRANSICION_INVALIDA y no cambia estado", async () => {
    const id = await crearTurno();
    const turno = await repos.turnos.buscarPorId(id);
    await repos.turnos.actualizar({ ...turno!, estado: "atendido" });

    const res = await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/turnos/${id}/cancelar` });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("TRANSICION_INVALIDA");

    const persistido = await repos.turnos.buscarPorId(id);
    expect(persistido!.estado).toBe("atendido");
  });

  it("turno inexistente responde 404 TURNO_NO_ENCONTRADO", async () => {
    const res = await app.inject({ headers: sesion.headers, method: "PATCH", url: "/api/turnos/00000000-0000-4000-8000-000000000099/cancelar" });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe("TURNO_NO_ENCONTRADO");
  });

  it("permite recrear un turno en el mismo horario tras cancelar", async () => {
    const id = await crearTurno();
    await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/turnos/${id}/cancelar` });

    const r2 = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/turnos", payload: baseBody() });
    expect(r2.statusCode).toBe(201);
  });
});
describe("RBAC y scoping en turnos", () => {
  let app: FastifyInstance;
  let repos: Repositorios;

  const baseBody = () => ({
    pacienteId: SEED_IDS.paciente1,
    profesionalId: SEED_IDS.profesional1,
    sillonId: SEED_IDS.sillon1,
    prestacionId: SEED_IDS.consulta,
    inicio: "2027-01-15T09:00:00.000Z",
  });

  beforeEach(async () => {
    repos = {
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
    app = buildServer(repos);
  });

  async function crearTurnoComo(rol: "administrador" | "recepcionista") {
    const { headers } = await autenticarseComo(app, rol);
    const response = await app.inject({ method: "POST", url: "/api/turnos", headers, payload: baseBody() });
    return response;
  }

  async function crearTurnoDeOtroProfesional() {
    const { headers } = await autenticarseComo(app, "recepcionista");
    const response = await app.inject({
      method: "POST",
      url: "/api/turnos",
      headers,
      payload: { ...baseBody(), profesionalId: SEED_IDS.profesional2, sillonId: SEED_IDS.sillon2 },
    });
    return response.json().id as string;
  }

  it("exige sesión para crear, listar, detallar y cancelar", async () => {
    await crearTurnoComo("recepcionista");
    const id = (await repos.turnos.listar())[0]!.id;

    const respuestas = [
      await app.inject({ method: "POST", url: "/api/turnos", payload: baseBody() }),
      await app.inject({ method: "GET", url: "/api/turnos" }),
      await app.inject({ method: "GET", url: `/api/turnos/${id}` }),
      await app.inject({ method: "PATCH", url: `/api/turnos/${id}/cancelar` }),
    ];

    for (const response of respuestas) {
      expect(response.statusCode).toBe(401);
      expect(response.json().code).toBe("NO_AUTENTICADO");
    }
  });

  it("profesional no puede crear ni cancelar turnos (403 SIN_PERMISO)", async () => {
    const { headers } = await autenticarseComo(app, "profesional");
    const id = (await crearTurnoComo("recepcionista")).json().id as string;

    const crear = await app.inject({ method: "POST", url: "/api/turnos", headers, payload: baseBody() });
    const cancelar = await app.inject({ method: "PATCH", url: `/api/turnos/${id}/cancelar`, headers });

    expect(crear.statusCode).toBe(403);
    expect(crear.json().code).toBe("SIN_PERMISO");
    expect(cancelar.statusCode).toBe(403);
    expect(cancelar.json().code).toBe("SIN_PERMISO");
  });

  it("el listado del profesional incluye solo sus turnos", async () => {
    const propio = await crearTurnoComo("recepcionista");
    await crearTurnoDeOtroProfesional();
    const { headers } = await autenticarseComo(app, "profesional");

    const response = await app.inject({ method: "GET", url: "/api/turnos", headers });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(1);
    expect(response.json()[0].id).toBe(propio.json().id);
  });

  it("el detalle de un turno ajeno responde 403 SIN_PERMISO", async () => {
    const ajeno = await crearTurnoDeOtroProfesional();
    const { headers } = await autenticarseComo(app, "profesional");

    const response = await app.inject({ method: "GET", url: `/api/turnos/${ajeno}`, headers });

    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("SIN_PERMISO");
  });

  it("un profesional sin vínculo no ve turnos", async () => {
    const usuario = await repos.usuarios.buscarPorId(SEED_IDS.odonto1);
    if (!usuario) throw new Error("usuario demo no encontrado");
    await repos.usuarios.crear({ ...usuario, profesionalId: undefined });
    const { headers } = await autenticarseComo(app, "profesional");

    const response = await app.inject({ method: "GET", url: "/api/turnos", headers });

    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("SIN_PERMISO");
  });

  it("administración y recepción listan sin scoping", async () => {
    await crearTurnoComo("recepcionista");
    await crearTurnoDeOtroProfesional();

    for (const rol of ["administrador", "recepcionista"] as const) {
      const { headers } = await autenticarseComo(app, rol);
      const response = await app.inject({ method: "GET", url: "/api/turnos", headers });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toHaveLength(2);
    }
  });

  it("un profesional no puede pedir turnos de otro profesional por query", async () => {
    const { headers } = await autenticarseComo(app, "profesional");

    const response = await app.inject({
      method: "GET",
      url: `/api/turnos?profesionalId=${SEED_IDS.profesional2}`,
      headers,
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("SIN_PERMISO");
  });

  it("una sesión expirada no permite mutar turnos", async () => {
    const id = (await crearTurnoComo("recepcionista")).json().id as string;
    const sesion = await repos.sesiones.crear(SEED_IDS.recepcion, -1);
    const headers = { cookie: `session=${sesion.token}` };

    const crear = await app.inject({ method: "POST", url: "/api/turnos", headers, payload: baseBody() });
    const cancelar = await app.inject({ method: "PATCH", url: `/api/turnos/${id}/cancelar`, headers });

    for (const response of [crear, cancelar]) {
      expect(response.statusCode).toBe(401);
      expect(response.json().code).toBe("NO_AUTENTICADO");
    }
    expect((await repos.turnos.buscarPorId(id))!.estado).toBe("pendiente");
    expect(await repos.turnos.listar()).toHaveLength(1);
  });

  it("la cancelación denegada a un profesional no cambia el estado", async () => {
    const id = (await crearTurnoComo("recepcionista")).json().id as string;
    const { headers } = await autenticarseComo(app, "profesional");

    const response = await app.inject({ method: "PATCH", url: `/api/turnos/${id}/cancelar`, headers });

    expect(response.statusCode).toBe(403);
    expect((await repos.turnos.buscarPorId(id))!.estado).toBe("pendiente");
  });

  it("el detalle de un turno propio responde 200", async () => {
    const propio = await crearTurnoComo("recepcionista");
    const { headers } = await autenticarseComo(app, "profesional");

    const response = await app.inject({
      method: "GET",
      url: `/api/turnos/${propio.json().id as string}`,
      headers,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().id).toBe(propio.json().id);
  });

  it("un administrador puede cancelar turnos", async () => {
    const id = (await crearTurnoComo("recepcionista")).json().id as string;
    const { headers } = await autenticarseComo(app, "administrador");

    const response = await app.inject({ method: "PATCH", url: `/api/turnos/${id}/cancelar`, headers });

    expect(response.statusCode).toBe(200);
    expect(response.json().estado).toBe("cancelado");
  });

  it("createdBy se toma de la sesión, no de un id fijo", async () => {
    const response = await crearTurnoComo("administrador");

    expect(response.statusCode).toBe(201);
    expect(response.json().createdBy).toBe(SEED_IDS.admin);
  });
});

describe("Bloqueos en POST /api/turnos", () => {
  let app: FastifyInstance;
  let repos: Repositorios;
  let recepcion: SesionDeTest;
  let admin: SesionDeTest;

  const bodyBase = () => ({
    pacienteId: SEED_IDS.paciente1,
    profesionalId: SEED_IDS.profesional1,
    sillonId: SEED_IDS.sillon1,
    prestacionId: SEED_IDS.consulta,
    inicio: "2027-01-15T09:00:00.000Z",
  });

  beforeEach(async () => {
    repos = {
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
    app = buildServer(repos);
    recepcion = await autenticarseComo(app, "recepcionista");
    admin = await autenticarseComo(app, "administrador");
  });

  async function bloquear(input: { profesionalId?: string; sillonId?: string; inicio: string; fin: string }) {
    return repos.bloqueos.crear(
      crearBloqueo({
        id: randomUUID(),
        motivo: "Bloqueo de prueba",
        creadoPor: SEED_IDS.admin,
        createdAt: new Date("2026-11-17T12:00:00.000Z"),
        ...input,
        inicio: new Date(input.inicio),
        fin: new Date(input.fin),
      }),
    );
  }

  function crearTurno(sesion: SesionDeTest, extra: Record<string, unknown> = {}) {
    return app.inject({
      method: "POST",
      url: "/api/turnos",
      headers: sesion.headers,
      payload: { ...bodyBase(), ...extra },
    });
  }

  it("bloqueo del profesional rechaza con 409 TURNO_BLOQUEADO y details.bloqueo", async () => {
    const bloqueo = await bloquear({
      profesionalId: SEED_IDS.profesional1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });

    const response = await crearTurno(recepcion, { inicio: "2027-01-15T09:30:00.000Z" });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      code: "TURNO_BLOQUEADO",
      details: {
        bloqueo: { id: bloqueo.id, inicio: "2027-01-15T09:00:00.000Z", fin: "2027-01-15T10:00:00.000Z" },
      },
    });
    expect(await repos.turnos.listar()).toEqual([]);
  });

  it("bloqueo del sillón rechaza con 409 TURNO_BLOQUEADO", async () => {
    await bloquear({
      sillonId: SEED_IDS.sillon1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });

    const response = await crearTurno(recepcion, { inicio: "2027-01-15T09:30:00.000Z" });

    expect(response.statusCode).toBe(409);
    expect(response.json().code).toBe("TURNO_BLOQUEADO");
    expect(response.json().details.bloqueo.id).toBeTruthy();
  });

  it("administrador puede forzar y el turno registra autorizadoPor", async () => {
    await bloquear({
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });

    const response = await crearTurno(admin, { inicio: "2027-01-15T09:30:00.000Z", forzar: true });

    expect(response.statusCode).toBe(201);
    expect(response.json().autorizadoPor).toBe(SEED_IDS.admin);
    expect(response.json().esSobreturno).toBe(false);
  });

  it("administrador que fuerza sin conflicto no registra autorizadoPor", async () => {
    const response = await crearTurno(admin, { forzar: true });

    expect(response.statusCode).toBe(201);
    expect(response.json().autorizadoPor).toBeUndefined();
  });

  it("recepcionista y profesional no pueden forzar aunque no haya bloqueo", async () => {
    const recepcionResponse = await crearTurno(recepcion, { forzar: true });
    expect(recepcionResponse.statusCode).toBe(403);
    expect(recepcionResponse.json().code).toBe("SIN_PERMISO");

    const profesional = await autenticarseComo(app, "profesional");
    const profesionalResponse = await crearTurno(profesional, { forzar: true });
    expect(profesionalResponse.statusCode).toBe(403);
    expect(profesionalResponse.json().code).toBe("SIN_PERMISO");

    expect(await repos.turnos.listar()).toEqual([]);
  });

  it("forzar no omite solapamientos con turnos ya existentes", async () => {
    await bloquear({
      profesionalId: SEED_IDS.profesional1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });
    expect((await crearTurno(admin, { forzar: true })).statusCode).toBe(201);

    const response = await crearTurno(admin, {
      pacienteId: SEED_IDS.paciente2,
      inicio: "2027-01-15T09:15:00.000Z",
      forzar: true,
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().code).toBe("TURNO_SOLAPADO_PROFESIONAL");
  });

  it("turno contiguo al bloqueo se permite", async () => {
    await bloquear({
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T09:30:00.000Z",
    });

    const response = await crearTurno(recepcion, { inicio: "2027-01-15T09:30:00.000Z" });

    expect(response.statusCode).toBe(201);
  });

  it("eliminar el bloqueo libera el horario para crear el turno", async () => {
    const bloqueo = await bloquear({
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T09:30:00.000Z",
    });

    expect((await crearTurno(recepcion)).statusCode).toBe(409);
    const eliminado = await app.inject({
      method: "DELETE",
      url: `/api/bloqueos/${bloqueo.id}`,
      headers: admin.headers,
    });
    expect(eliminado.statusCode).toBe(204);
    expect((await crearTurno(recepcion)).statusCode).toBe(201);
  });

  it("profesional no puede forzar aunque el turno sea sobreturno", async () => {
    const profesional = await autenticarseComo(app, "profesional");

    const response = await crearTurno(profesional, { esSobreturno: true, forzar: true });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: "SIN_PERMISO", details: {} });
    expect(await repos.turnos.listar()).toEqual([]);
  });
});

describe("Sobreturnos en POST /api/turnos", () => {
  let app: FastifyInstance;
  let repos: Repositorios;
  let admin: SesionDeTest;
  let recepcion: SesionDeTest;

  const bodyBase = () => ({
    pacienteId: SEED_IDS.paciente1,
    profesionalId: SEED_IDS.profesional1,
    sillonId: SEED_IDS.sillon1,
    prestacionId: SEED_IDS.consulta,
    inicio: "2027-01-15T09:00:00.000Z",
  });

  beforeEach(async () => {
    repos = {
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
    app = buildServer(repos);
    admin = await autenticarseComo(app, "administrador");
    recepcion = await autenticarseComo(app, "recepcionista");
  });

  function crear(sesion: SesionDeTest, extra: Record<string, unknown> = {}) {
    return app.inject({
      method: "POST",
      url: "/api/turnos",
      headers: sesion.headers,
      payload: { ...bodyBase(), ...extra },
    });
  }

  async function bloquear(input: { profesionalId?: string; sillonId?: string; inicio: string; fin: string }) {
    return repos.bloqueos.crear(
      crearBloqueo({
        id: randomUUID(),
        motivo: "Bloqueo de prueba",
        creadoPor: SEED_IDS.admin,
        createdAt: new Date("2026-11-17T12:00:00.000Z"),
        ...input,
        inicio: new Date(input.inicio),
        fin: new Date(input.fin),
      }),
    );
  }

  it("un administrador crea un sobreturno con 201, flag y autorizadoPor", async () => {
    const response = await crear(admin, { esSobreturno: true });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      esSobreturno: true,
      autorizadoPor: SEED_IDS.admin,
      estado: "pendiente",
    });
  });

  it("una recepcionista crea un sobreturno con 201, flag y autorizadoPor", async () => {
    const response = await crear(recepcion, { esSobreturno: true });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      esSobreturno: true,
      autorizadoPor: SEED_IDS.recepcion,
    });
  });

  it("un profesional con esSobreturno recibe 403 SIN_PERMISO y no persiste", async () => {
    const profesional = await autenticarseComo(app, "profesional");

    const response = await crear(profesional, { esSobreturno: true });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: "SIN_PERMISO", details: {} });
    expect(await repos.turnos.listar()).toEqual([]);
  });

  it.each([
    ["null", null],
    ["string", "true"],
    ["número", 1],
  ])("un flag %s inválido responde 400 con la ruta del campo", async (_descripcion, valor) => {
    const response = await crear(recepcion, { esSobreturno: valor });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: "VALIDACION_FALLIDA",
      details: { esSobreturno: expect.any(String) },
    });
    expect(await repos.turnos.listar()).toEqual([]);
  });

  it("un sillón solapado rechaza el sobreturno con 409 TURNO_SOLAPADO_SILLON", async () => {
    expect((await crear(recepcion)).statusCode).toBe(201);

    const response = await crear(admin, {
      esSobreturno: true,
      pacienteId: SEED_IDS.paciente2,
      inicio: "2027-01-15T09:15:00.000Z",
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().code).toBe("TURNO_SOLAPADO_SILLON");
    expect(await repos.turnos.listar()).toHaveLength(1);
  });

  it("un bloqueo de sillón rechaza el sobreturno con 409 TURNO_BLOQUEADO", async () => {
    const bloqueo = await bloquear({
      sillonId: SEED_IDS.sillon1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });

    const response = await crear(recepcion, { esSobreturno: true, inicio: "2027-01-15T09:30:00.000Z" });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      code: "TURNO_BLOQUEADO",
      details: { bloqueo: { id: bloqueo.id } },
    });
    expect(await repos.turnos.listar()).toEqual([]);
  });

  it("un administrador combina sobreturno y forzar sobre un bloqueo de sillón", async () => {
    await bloquear({
      sillonId: SEED_IDS.sillon1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });

    const response = await crear(admin, {
      esSobreturno: true,
      forzar: true,
      inicio: "2027-01-15T09:30:00.000Z",
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      esSobreturno: true,
      autorizadoPor: SEED_IDS.admin,
    });
  });

  it("una recepcionista no puede forzar aunque envíe esSobreturno", async () => {
    const response = await crear(recepcion, { esSobreturno: true, forzar: true });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: "SIN_PERMISO", details: {} });
    expect(await repos.turnos.listar()).toEqual([]);
  });

  it("autorizadoPor del body es ignorado: prevalece el id de la sesión", async () => {
    const suplantado = "00000000-0000-4000-8000-000000000099";

    const response = await crear(recepcion, { esSobreturno: true, autorizadoPor: suplantado });

    expect(response.statusCode).toBe(201);
    expect(response.json().autorizadoPor).toBe(SEED_IDS.recepcion);
    expect(response.json().autorizadoPor).not.toBe(suplantado);
    const persistido = await repos.turnos.buscarPorId(response.json().id);
    expect(persistido?.autorizadoPor).toBe(SEED_IDS.recepcion);
  });

  it("el sobreturno aparece como turno activo en GET /api/turnos", async () => {
    const creado = await crear(admin, { esSobreturno: true });
    expect(creado.statusCode).toBe(201);

    const res = await app.inject({
      method: "GET",
      url: "/api/turnos?desde=2027-01-15T08:00:00.000Z&hasta=2027-01-15T12:00:00.000Z",
      headers: admin.headers,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(1);
    expect(res.json()[0]).toMatchObject({
      id: creado.json().id,
      estado: "pendiente",
      esSobreturno: true,
    });
  });

  it("sin el flag sigue rechazando solapamiento y bloqueo del profesional sin autorizadoPor", async () => {
    const primera = await crear(recepcion);
    expect(primera.statusCode).toBe(201);

    const solapado = await crear(recepcion, {
      pacienteId: SEED_IDS.paciente2,
      sillonId: SEED_IDS.sillon2,
      inicio: "2027-01-15T09:15:00.000Z",
    });
    expect(solapado.statusCode).toBe(409);
    expect(solapado.json().code).toBe("TURNO_SOLAPADO_PROFESIONAL");

    await bloquear({
      profesionalId: SEED_IDS.profesional2,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });
    const bloqueado = await crear(recepcion, {
      profesionalId: SEED_IDS.profesional2,
      sillonId: SEED_IDS.sillon2,
    });
    expect(bloqueado.statusCode).toBe(409);
    expect(bloqueado.json().code).toBe("TURNO_BLOQUEADO");

    const turnos = await repos.turnos.listar();
    expect(turnos).toHaveLength(1);
    expect(turnos[0]?.esSobreturno).toBe(false);
    expect(turnos[0]?.autorizadoPor).toBeUndefined();
  });
});
