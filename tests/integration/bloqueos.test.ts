import { beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import type { Repositorios } from "../../src/application/ports/repositorios.js";
import { buildServer } from "../../src/http/server.js";
import { InMemoryBloqueoRepository } from "../../src/infrastructure/persistence/in-memory-bloqueo-repository.js";
import { InMemoryPacienteRepository } from "../../src/infrastructure/persistence/in-memory-paciente-repository.js";
import { InMemoryPrestacionRepository } from "../../src/infrastructure/persistence/in-memory-prestacion-repository.js";
import { InMemoryProfesionalRepository } from "../../src/infrastructure/persistence/in-memory-profesional-repository.js";
import { InMemorySessionRepository } from "../../src/infrastructure/persistence/in-memory-session-repository.js";
import { InMemorySillonRepository } from "../../src/infrastructure/persistence/in-memory-sillon-repository.js";
import { InMemoryTurnoRepository } from "../../src/infrastructure/persistence/in-memory-turno-repository.js";
import { InMemoryUsuarioRepository } from "../../src/infrastructure/persistence/in-memory-usuario-repository.js";
import { cargarSeed, SEED_IDS } from "../../src/infrastructure/seed.js";
import { autenticarseComo, type SesionDeTest } from "../helpers/auth.js";

const UUID_INEXISTENTE = "00000000-0000-4000-8000-000000000099";

const bodyBase = () => ({
  profesionalId: SEED_IDS.profesional1,
  inicio: "2027-01-15T09:00:00.000Z",
  fin: "2027-01-15T09:30:00.000Z",
  motivo: "Cirugía",
});

describe("/api/bloqueos", () => {
  let app: FastifyInstance;
  let repos: Repositorios;
  let admin: SesionDeTest;
  let recepcion: SesionDeTest;
  let profesional: SesionDeTest;

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
    profesional = await autenticarseComo(app, "profesional");
  });

  async function crear(sesion: SesionDeTest, body: Record<string, unknown> = bodyBase()) {
    return app.inject({ method: "POST", url: "/api/bloqueos", headers: sesion.headers, payload: body });
  }

  it("POST con Administrador responde 201 con id, creadoPor y createdAt", async () => {
    const response = await crear(admin);

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.profesionalId).toBe(SEED_IDS.profesional1);
    expect(body.inicio).toBe("2027-01-15T09:00:00.000Z");
    expect(body.fin).toBe("2027-01-15T09:30:00.000Z");
    expect(body.motivo).toBe("Cirugía");
    expect(body.creadoPor).toBe(admin.usuario.id);
    expect(body.createdAt).toBeTruthy();
  });

  it("POST con Recepcionista está permitido y admite sillón", async () => {
    const response = await crear(recepcion, { sillonId: SEED_IDS.sillon1, inicio: bodyBase().inicio, fin: bodyBase().fin, motivo: "Limpieza" });

    expect(response.statusCode).toBe(201);
    expect(response.json().sillonId).toBe(SEED_IDS.sillon1);
    expect(response.json().profesionalId).toBeUndefined();
  });

  it("POST con profesional responde 403 SIN_PERMISO y no persiste", async () => {
    const response = await crear(profesional);

    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("SIN_PERMISO");
    expect(await repos.bloqueos.listar()).toEqual([]);
  });

  it("POST sin sesión responde 401 NO_AUTENTICADO", async () => {
    const response = await app.inject({ method: "POST", url: "/api/bloqueos", payload: bodyBase() });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe("NO_AUTENTICADO");
  });

  it("POST con fin anterior o igual al inicio responde 400 BLOQUEO_INTERVALO_INVALIDO", async () => {
    for (const fin of ["2027-01-15T08:59:00.000Z", "2027-01-15T09:00:00.000Z"]) {
      const response = await crear(admin, { ...bodyBase(), fin });
      expect(response.statusCode).toBe(400);
      expect(response.json().code).toBe("BLOQUEO_INTERVALO_INVALIDO");
    }
    expect(await repos.bloqueos.listar()).toEqual([]);
  });

  it("POST sin recursos responde 400 BLOQUEO_RECURSO_REQUERIDO", async () => {
    const body = bodyBase();
    delete body.profesionalId;
    const response = await crear(admin, body);

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe("BLOQUEO_RECURSO_REQUERIDO");
  });

  it("POST con profesional inexistente responde 404 y con inactivo 409", async () => {
    const inexistente = await crear(admin, { ...bodyBase(), profesionalId: UUID_INEXISTENTE });
    expect(inexistente.statusCode).toBe(404);
    expect(inexistente.json().code).toBe("PROFESIONAL_NO_ENCONTRADO");

    const profesionalInactivo = await repos.profesionales.buscarPorId(SEED_IDS.profesional2);
    if (!profesionalInactivo) throw new Error("profesional base no encontrado");
    await repos.profesionales.crear({ ...profesionalInactivo, activo: false });
    const inactivo = await crear(admin, { ...bodyBase(), profesionalId: SEED_IDS.profesional2 });
    expect(inactivo.statusCode).toBe(409);
    expect(inactivo.json().code).toBe("RECURSO_INACTIVO");
    expect(await repos.bloqueos.listar()).toEqual([]);
  });

  it("GET con Administrador y Recepcionista responde 200; profesional 403; sin sesión 401", async () => {
    await crear(admin);
    await crear(recepcion, { ...bodyBase(), inicio: "2027-01-15T10:00:00.000Z", fin: "2027-01-15T10:30:00.000Z" });

    const respuestaAdmin = await app.inject({ method: "GET", url: "/api/bloqueos", headers: admin.headers });
    expect(respuestaAdmin.statusCode).toBe(200);
    expect(respuestaAdmin.json()).toHaveLength(2);

    const respuestaRecepcion = await app.inject({ method: "GET", url: "/api/bloqueos", headers: recepcion.headers });
    expect(respuestaRecepcion.statusCode).toBe(200);

    const respuestaProfesional = await app.inject({ method: "GET", url: "/api/bloqueos", headers: profesional.headers });
    expect(respuestaProfesional.statusCode).toBe(403);
    expect(respuestaProfesional.json().code).toBe("SIN_PERMISO");

    const sinSesion = await app.inject({ method: "GET", url: "/api/bloqueos" });
    expect(sinSesion.statusCode).toBe(401);
    expect(sinSesion.json().code).toBe("NO_AUTENTICADO");
  });

  it("GET filtra por rango semiabierto y ordena por inicio", async () => {
    await crear(admin, { ...bodyBase(), inicio: "2027-01-15T11:00:00.000Z", fin: "2027-01-15T11:30:00.000Z" });
    await crear(admin, { ...bodyBase(), inicio: "2027-01-15T09:00:00.000Z", fin: "2027-01-15T09:30:00.000Z" });
    await crear(admin, { ...bodyBase(), inicio: "2027-01-15T10:00:00.000Z", fin: "2027-01-15T10:30:00.000Z" });

    const response = await app.inject({
      method: "GET",
      url: "/api/bloqueos?desde=2027-01-15T09:30:00.000Z&hasta=2027-01-15T11:00:00.000Z",
      headers: admin.headers,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().map((b: { inicio: string }) => b.inicio)).toEqual([
      "2027-01-15T10:00:00.000Z",
    ]);
  });

  it("GET con desde >= hasta responde 400 RANGO_INVALIDO", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/bloqueos?desde=2027-01-15T10:00:00.000Z&hasta=2027-01-15T10:00:00.000Z",
      headers: admin.headers,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "RANGO_INVALIDO" });
  });

  it("DELETE con Administrador responde 204 sin body y libera el bloqueo", async () => {
    const creado = (await crear(admin)).json();

    const response = await app.inject({
      method: "DELETE",
      url: `/api/bloqueos/${creado.id as string}`,
      headers: admin.headers,
    });
    expect(response.statusCode).toBe(204);
    expect(response.body).toBe("");
    expect((await app.inject({ method: "GET", url: "/api/bloqueos", headers: admin.headers })).json()).toEqual([]);
  });

  it("DELETE inexistente responde 404 BLOQUEO_NO_ENCONTRADO", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/api/bloqueos/${UUID_INEXISTENTE}`,
      headers: admin.headers,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: "BLOQUEO_NO_ENCONTRADO", details: { id: UUID_INEXISTENTE } });
  });

  it("POST rechaza UUID inválido, fecha inválida y motivo faltante con VALIDACION_FALLIDA", async () => {
    const casos = [
      { ...bodyBase(), profesionalId: "no-es-uuid" },
      { ...bodyBase(), inicio: "no-es-fecha" },
      { profesionalId: SEED_IDS.profesional1, inicio: bodyBase().inicio, fin: bodyBase().fin },
    ];

    for (const body of casos) {
      const response = await crear(admin, body);
      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.code).toBe("VALIDACION_FALLIDA");
      expect(json.message).toBeTruthy();
      expect(Object.keys(json.details).length).toBeGreaterThan(0);
    }
    expect(await repos.bloqueos.listar()).toEqual([]);
  });

  it("POST rechaza inicio o fin faltantes con detalle por campo", async () => {
    const sinInicio = { profesionalId: SEED_IDS.profesional1, fin: bodyBase().fin, motivo: "Cirugía" };
    const sinFin = { profesionalId: SEED_IDS.profesional1, inicio: bodyBase().inicio, motivo: "Cirugía" };

    for (const body of [sinInicio, sinFin]) {
      const response = await crear(admin, body);
      expect(response.statusCode).toBe(400);
      expect(response.json().code).toBe("VALIDACION_FALLIDA");
      expect(Object.keys(response.json().details).length).toBeGreaterThan(0);
    }
  });

  it("GET sin filtros y con un solo límite devuelve los bloqueos correctos", async () => {
    await crear(admin);
    await crear(admin, { ...bodyBase(), inicio: "2027-01-15T11:00:00.000Z", fin: "2027-01-15T11:30:00.000Z" });

    const todos = await app.inject({ method: "GET", url: "/api/bloqueos", headers: admin.headers });
    expect(todos.json()).toHaveLength(2);

    const desdeSolo = await app.inject({
      method: "GET",
      url: "/api/bloqueos?desde=2027-01-15T10:00:00.000Z",
      headers: admin.headers,
    });
    expect(desdeSolo.statusCode).toBe(200);
    expect(desdeSolo.json().map((b: { inicio: string }) => b.inicio)).toEqual([
      "2027-01-15T11:00:00.000Z",
    ]);
  });

  it("POST acepta profesional y sillón juntos y rechaza sillón inactivo", async () => {
    const ambos = await crear(admin, { ...bodyBase(), sillonId: SEED_IDS.sillon1 });
    expect(ambos.statusCode).toBe(201);
    expect(ambos.json().profesionalId).toBe(SEED_IDS.profesional1);
    expect(ambos.json().sillonId).toBe(SEED_IDS.sillon1);

    const sillon = await repos.sillones.buscarPorId(SEED_IDS.sillon2);
    if (!sillon) throw new Error("sillón base no encontrado");
    await repos.sillones.crear({ ...sillon, activo: false });
    const inactivo = await crear(admin, { ...bodyBase(), sillonId: SEED_IDS.sillon2 });
    expect(inactivo.statusCode).toBe(409);
    expect(inactivo.json().code).toBe("RECURSO_INACTIVO");
  });

  it("DELETE con UUID inválido responde 400 VALIDACION_FALLIDA", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/api/bloqueos/no-es-uuid",
      headers: admin.headers,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe("VALIDACION_FALLIDA");
  });

  it("DELETE con Recepcionista o Profesional responde 403; sin sesión 401", async () => {
    const creado = (await crear(admin)).json();
    const url = `/api/bloqueos/${creado.id as string}`;

    for (const sesion of [recepcion, profesional]) {
      const response = await app.inject({ method: "DELETE", url, headers: sesion.headers });
      expect(response.statusCode).toBe(403);
      expect(response.json().code).toBe("SIN_PERMISO");
    }
    const sinSesion = await app.inject({ method: "DELETE", url });
    expect(sinSesion.statusCode).toBe(401);
    expect(sinSesion.json().code).toBe("NO_AUTENTICADO");
    expect(await repos.bloqueos.listar()).toHaveLength(1);
  });
});
