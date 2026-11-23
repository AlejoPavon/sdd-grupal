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

describe("Pacientes CRUD", () => {
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

  it("alta válida responde 201 activo", async () => {
    const res = await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "Ana", apellido: "Demo" } });
    expect(res.statusCode).toBe(201);
    expect(res.json().activo).toBe(true);
  });

  it("falta nombre → 400 VALIDACION_FALLIDA", async () => {
    const res = await app.inject({ method: "POST", url: "/api/pacientes", payload: { apellido: "Demo" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("VALIDACION_FALLIDA");
    expect(res.json().details.nombre).toBeTruthy();
  });

  it("falta apellido → 400 VALIDACION_FALLIDA", async () => {
    const res = await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "Ana" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("VALIDACION_FALLIDA");
    expect(res.json().details.apellido).toBeTruthy();
  });

  it("email duplicado entre activos → 409 PACIENTE_DUPLICADO", async () => {
    await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B", email: "dup@demo.local" } });
    const res = await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "C", apellido: "D", email: "dup@demo.local" } });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("PACIENTE_DUPLICADO");
    expect(res.json().details.campo).toBe("email");
  });

  it("documento duplicado entre activos → 409 PACIENTE_DUPLICADO", async () => {
    await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B", documento: "123" } });
    const res = await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "C", apellido: "D", documento: "123" } });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("PACIENTE_DUPLICADO");
    expect(res.json().details.campo).toBe("documento");
  });

  it("reutilizar email de paciente dado de baja → 201", async () => {
    const r = await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B", email: "baja@demo.local" } });
    const id = r.json().id;
    await app.inject({ method: "DELETE", url: `/api/pacientes/${id}` });
    const res = await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "C", apellido: "D", email: "baja@demo.local" } });
    expect(res.statusCode).toBe(201);
  });

  it("búsqueda parcial case-insensitive", async () => {
    await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "Ana", apellido: "Demo" } });
    const res = await app.inject({ method: "GET", url: "/api/pacientes?q=dEm" });
    expect(res.statusCode).toBe(200);
    expect(res.json().some((p: { apellido: string }) => p.apellido === "Demo")).toBe(true);
  });

  it("búsqueda no devuelve inactivos", async () => {
    const r = await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "Oculto", apellido: "X" } });
    const id = r.json().id;
    await app.inject({ method: "DELETE", url: `/api/pacientes/${id}` });
    const res = await app.inject({ method: "GET", url: "/api/pacientes?q=ocul" });
    expect(res.json()).toHaveLength(0);
  });

  it("listado sin q devuelve solo activos", async () => {
    const r = await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "Inactivo", apellido: "X" } });
    await app.inject({ method: "DELETE", url: `/api/pacientes/${r.json().id}` });
    await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "Activo", apellido: "Y" } });
    const res = await app.inject({ method: "GET", url: "/api/pacientes" });
    expect(res.json().every((p: { activo: boolean }) => p.activo === true)).toBe(true);
  });

  it("GET /:id existente", async () => {
    const r = await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "Ana", apellido: "Demo" } });
    const id = r.json().id;
    const res = await app.inject({ method: "GET", url: `/api/pacientes/${id}` });
    expect(res.statusCode).toBe(200);
  });

  it("GET /:id inexistente → 404 PACIENTE_NO_ENCONTRADO", async () => {
    const res = await app.inject({ method: "GET", url: `/api/pacientes/${randomUUID()}` });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe("PACIENTE_NO_ENCONTRADO");
  });

  it("baja lógica → activo false, accesible por GET, no en listado", async () => {
    const r = await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "Ana", apellido: "Demo" } });
    const id = r.json().id;
    const del = await app.inject({ method: "DELETE", url: `/api/pacientes/${id}` });
    expect(del.statusCode).toBe(200);
    expect(del.json().activo).toBe(false);
    const get = await app.inject({ method: "GET", url: `/api/pacientes/${id}` });
    expect(get.json().activo).toBe(false);
    const list = await app.inject({ method: "GET", url: "/api/pacientes" });
    expect(list.json().some((p: { id: string }) => p.id === id)).toBe(false);
  });

  it("DELETE ya inactivo → 200 idempotente", async () => {
    const r = await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "Ana", apellido: "Demo" } });
    const id = r.json().id;
    await app.inject({ method: "DELETE", url: `/api/pacientes/${id}` });
    const del = await app.inject({ method: "DELETE", url: `/api/pacientes/${id}` });
    expect(del.statusCode).toBe(200);
  });

  it("DELETE inexistente → 404", async () => {
    const res = await app.inject({ method: "DELETE", url: `/api/pacientes/${randomUUID()}` });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe("PACIENTE_NO_ENCONTRADO");
  });

  it("PATCH con email de otro activo → 409", async () => {
    const a = await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B", email: "a@demo.local" } });
    await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "C", apellido: "D", email: "b@demo.local" } });
    const res = await app.inject({ method: "PATCH", url: `/api/pacientes/${a.json().id}`, payload: { email: "b@demo.local" } });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("PACIENTE_DUPLICADO");
  });

  it("PATCH con documento duplicado → 409", async () => {
    const a = await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B", documento: "111" } });
    await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "C", apellido: "D", documento: "222" } });
    const res = await app.inject({ method: "PATCH", url: `/api/pacientes/${a.json().id}`, payload: { documento: "222" } });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("PACIENTE_DUPLICADO");
  });

  it("PATCH a sí mismo → ok", async () => {
    const r = await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B", email: "self@demo.local", documento: "999" } });
    const id = r.json().id;
    const res = await app.inject({ method: "PATCH", url: `/api/pacientes/${id}`, payload: { email: "self@demo.local", documento: "999" } });
    expect(res.statusCode).toBe(200);
  });

  it("PATCH inexistente → 404", async () => {
    const res = await app.inject({ method: "PATCH", url: `/api/pacientes/${randomUUID()}`, payload: { nombre: "X" } });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe("PACIENTE_NO_ENCONTRADO");
  });

  it("reactivar con email duplicado → 409", async () => {
    await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "Activo", apellido: "A", email: "dup3@demo.local" } });
    const { randomUUID } = await import("node:crypto");
    const { InMemoryPacienteRepository } = await import("../../src/infrastructure/persistence/in-memory-paciente-repository.js");
    void InMemoryPacienteRepository;
    const inactivo = {
      id: randomUUID(),
      nombre: "Inactivo",
      apellido: "B",
      email: "dup3@demo.local",
      activo: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await repos.pacientes.crear(inactivo as never);
    const res = await app.inject({ method: "PATCH", url: `/api/pacientes/${inactivo.id}`, payload: { activo: true } });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("PACIENTE_DUPLICADO");
  });

  it("reactivar con documento duplicado → 409 PACIENTE_DUPLICADO y permanece inactivo", async () => {
    await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "Activo", apellido: "A", documento: "dupdoc" } });
    const { randomUUID } = await import("node:crypto");
    const inactivo = {
      id: randomUUID(),
      nombre: "Inactivo",
      apellido: "B",
      documento: "dupdoc",
      activo: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await repos.pacientes.crear(inactivo as never);
    const res = await app.inject({ method: "PATCH", url: `/api/pacientes/${inactivo.id}`, payload: { activo: true } });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("PACIENTE_DUPLICADO");
    const get = await app.inject({ method: "GET", url: `/api/pacientes/${inactivo.id}` });
    expect(get.json().activo).toBe(false);
  });

  it("reactivar sin conflicto → queda activo", async () => {
    const r = await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "Ana", apellido: "Demo" } });
    const id = r.json().id;
    await app.inject({ method: "DELETE", url: `/api/pacientes/${id}` });
    const res = await app.inject({ method: "PATCH", url: `/api/pacientes/${id}`, payload: { activo: true } });
    expect(res.statusCode).toBe(200);
    expect(res.json().activo).toBe(true);
  });

  it("turno con paciente inactivo → 409 RECURSO_INACTIVO", async () => {
    const r = await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "Inactivo", apellido: "P" } });
    const pid = r.json().id;
    await app.inject({ method: "DELETE", url: `/api/pacientes/${pid}` });
    const body = {
      pacienteId: pid,
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      prestacionId: SEED_IDS.consulta,
      inicio: "2026-11-18T09:00:00.000Z",
    };
    const res = await app.inject({ method: "POST", url: "/api/turnos", payload: body });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("RECURSO_INACTIVO");
  });
});