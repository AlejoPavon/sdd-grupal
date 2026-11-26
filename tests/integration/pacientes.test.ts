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
import { InMemoryBloqueoRepository } from "../../src/infrastructure/persistence/in-memory-bloqueo-repository.js";
import { InMemorySessionRepository } from "../../src/infrastructure/persistence/in-memory-session-repository.js";
import { autenticarseComo, type SesionDeTest } from "../helpers/auth.js";
import { cargarSeed, SEED_IDS } from "../../src/infrastructure/seed.js";
import type { Repositorios } from "../../src/application/ports/repositorios.js";

describe("Pacientes CRUD", () => {
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

  it("alta válida responde 201 activo", async () => {
    const res = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "Ana", apellido: "Demo" } });
    expect(res.statusCode).toBe(201);
    expect(res.json().activo).toBe(true);
  });

  it("alta sin documento ni teléfono → 201", async () => {
    const res = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "Sin", apellido: "Contacto" } });
    expect(res.statusCode).toBe(201);
  });

  it("alta con documento de letras → 400 VALIDACION_FALLIDA", async () => {
    const res = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B", documento: "abcdefgh" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("VALIDACION_FALLIDA");
    expect(res.json().details.documento).toContain("8 números");
  });

  it("alta con documento de 7 dígitos → 400 VALIDACION_FALLIDA", async () => {
    const res = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B", documento: "1234567" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("VALIDACION_FALLIDA");
    expect(res.json().details.documento).toContain("8 números");
  });

  it("alta con documento de 9 dígitos → 400 VALIDACION_FALLIDA", async () => {
    const res = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B", documento: "123456789" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("VALIDACION_FALLIDA");
    expect(res.json().details.documento).toContain("8 números");
  });

  it("alta con teléfono de letras → 400 VALIDACION_FALLIDA", async () => {
    const res = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B", telefono: "abcdefghij" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("VALIDACION_FALLIDA");
    expect(res.json().details.telefono).toContain("10 números");
  });

  it("alta con teléfono de 9 dígitos → 400 VALIDACION_FALLIDA", async () => {
    const res = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B", telefono: "123456789" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("VALIDACION_FALLIDA");
    expect(res.json().details.telefono).toContain("10 números");
  });

  it("alta con documento de 8 dígitos y teléfono de 10 dígitos → 201", async () => {
    const res = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B", documento: "12345678", telefono: "1123456789" } });
    expect(res.statusCode).toBe(201);
  });

  it("falta nombre → 400 VALIDACION_FALLIDA", async () => {
    const res = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { apellido: "Demo" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("VALIDACION_FALLIDA");
    expect(res.json().details.nombre).toBeTruthy();
  });

  it("falta apellido → 400 VALIDACION_FALLIDA", async () => {
    const res = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "Ana" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("VALIDACION_FALLIDA");
    expect(res.json().details.apellido).toBeTruthy();
  });

  it("email duplicado entre activos → 409 PACIENTE_DUPLICADO", async () => {
    await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B", email: "dup@demo.local" } });
    const res = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "C", apellido: "D", email: "dup@demo.local" } });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("PACIENTE_DUPLICADO");
    expect(res.json().details.campo).toBe("email");
  });

  it("documento duplicado entre activos → 409 PACIENTE_DUPLICADO", async () => {
    await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B", documento: "12345678" } });
    const res = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "C", apellido: "D", documento: "12345678" } });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("PACIENTE_DUPLICADO");
    expect(res.json().details.campo).toBe("documento");
  });

  it("reutilizar email de paciente dado de baja → 201", async () => {
    const r = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B", email: "baja@demo.local" } });
    const id = r.json().id;
    await app.inject({ headers: sesion.headers, method: "DELETE", url: `/api/pacientes/${id}` });
    const res = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "C", apellido: "D", email: "baja@demo.local" } });
    expect(res.statusCode).toBe(201);
  });

  it("búsqueda parcial case-insensitive", async () => {
    await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "Ana", apellido: "Demo" } });
    const res = await app.inject({ headers: sesion.headers, method: "GET", url: "/api/pacientes?q=dEm" });
    expect(res.statusCode).toBe(200);
    expect(res.json().some((p: { apellido: string }) => p.apellido === "Demo")).toBe(true);
  });

  it("búsqueda no devuelve inactivos", async () => {
    const r = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "Oculto", apellido: "X" } });
    const id = r.json().id;
    await app.inject({ headers: sesion.headers, method: "DELETE", url: `/api/pacientes/${id}` });
    const res = await app.inject({ headers: sesion.headers, method: "GET", url: "/api/pacientes?q=ocul" });
    expect(res.json()).toHaveLength(0);
  });

  it("listado sin q devuelve solo activos", async () => {
    const r = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "Inactivo", apellido: "X" } });
    await app.inject({ headers: sesion.headers, method: "DELETE", url: `/api/pacientes/${r.json().id}` });
    await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "Activo", apellido: "Y" } });
    const res = await app.inject({ headers: sesion.headers, method: "GET", url: "/api/pacientes" });
    expect(res.json().every((p: { activo: boolean }) => p.activo === true)).toBe(true);
  });

  it("GET /:id existente", async () => {
    const r = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "Ana", apellido: "Demo" } });
    const id = r.json().id;
    const res = await app.inject({ headers: sesion.headers, method: "GET", url: `/api/pacientes/${id}` });
    expect(res.statusCode).toBe(200);
  });

  it("GET /:id inexistente → 404 PACIENTE_NO_ENCONTRADO", async () => {
    const res = await app.inject({ headers: sesion.headers, method: "GET", url: `/api/pacientes/${randomUUID()}` });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe("PACIENTE_NO_ENCONTRADO");
  });

  it("baja lógica → activo false, accesible por GET, no en listado", async () => {
    const r = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "Ana", apellido: "Demo" } });
    const id = r.json().id;
    const del = await app.inject({ headers: sesion.headers, method: "DELETE", url: `/api/pacientes/${id}` });
    expect(del.statusCode).toBe(200);
    expect(del.json().activo).toBe(false);
    const get = await app.inject({ headers: sesion.headers, method: "GET", url: `/api/pacientes/${id}` });
    expect(get.json().activo).toBe(false);
    const list = await app.inject({ headers: sesion.headers, method: "GET", url: "/api/pacientes" });
    expect(list.json().some((p: { id: string }) => p.id === id)).toBe(false);
  });

  it("DELETE ya inactivo → 200 idempotente", async () => {
    const r = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "Ana", apellido: "Demo" } });
    const id = r.json().id;
    await app.inject({ headers: sesion.headers, method: "DELETE", url: `/api/pacientes/${id}` });
    const del = await app.inject({ headers: sesion.headers, method: "DELETE", url: `/api/pacientes/${id}` });
    expect(del.statusCode).toBe(200);
  });

  it("DELETE inexistente → 404", async () => {
    const res = await app.inject({ headers: sesion.headers, method: "DELETE", url: `/api/pacientes/${randomUUID()}` });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe("PACIENTE_NO_ENCONTRADO");
  });

  it("PATCH con email de otro activo → 409", async () => {
    const a = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B", email: "a@demo.local" } });
    await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "C", apellido: "D", email: "b@demo.local" } });
    const res = await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/pacientes/${a.json().id}`, payload: { email: "b@demo.local" } });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("PACIENTE_DUPLICADO");
  });

  it("PATCH con documento duplicado → 409", async () => {
    const a = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B", documento: "11111111" } });
    await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "C", apellido: "D", documento: "22222222" } });
    const res = await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/pacientes/${a.json().id}`, payload: { documento: "22222222" } });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("PACIENTE_DUPLICADO");
  });

  it("PATCH a sí mismo → ok", async () => {
    const r = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B", email: "self@demo.local", documento: "99999999" } });
    const id = r.json().id;
    const res = await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/pacientes/${id}`, payload: { email: "self@demo.local", documento: "99999999" } });
    expect(res.statusCode).toBe(200);
  });

  it("PATCH con documento de letras → 400 VALIDACION_FALLIDA", async () => {
    const r = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B" } });
    const res = await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/pacientes/${r.json().id}`, payload: { documento: "abcdefgh" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("VALIDACION_FALLIDA");
    expect(res.json().details.documento).toContain("8 números");
  });

  it("PATCH con documento de 7 dígitos → 400 VALIDACION_FALLIDA", async () => {
    const r = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B" } });
    const res = await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/pacientes/${r.json().id}`, payload: { documento: "1234567" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("VALIDACION_FALLIDA");
    expect(res.json().details.documento).toContain("8 números");
  });

  it("PATCH con documento de 9 dígitos → 400 VALIDACION_FALLIDA", async () => {
    const r = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B" } });
    const res = await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/pacientes/${r.json().id}`, payload: { documento: "123456789" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("VALIDACION_FALLIDA");
    expect(res.json().details.documento).toContain("8 números");
  });

  it("PATCH con teléfono de letras → 400 VALIDACION_FALLIDA", async () => {
    const r = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B" } });
    const res = await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/pacientes/${r.json().id}`, payload: { telefono: "abcdefghij" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("VALIDACION_FALLIDA");
    expect(res.json().details.telefono).toContain("10 números");
  });

  it("PATCH con teléfono de 9 dígitos → 400 VALIDACION_FALLIDA", async () => {
    const r = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B" } });
    const res = await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/pacientes/${r.json().id}`, payload: { telefono: "123456789" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("VALIDACION_FALLIDA");
    expect(res.json().details.telefono).toContain("10 números");
  });

  it("PATCH con documento de 8 dígitos y teléfono de 10 dígitos → 200", async () => {
    const r = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B" } });
    const res = await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/pacientes/${r.json().id}`, payload: { documento: "12345678", telefono: "1123456789" } });
    expect(res.statusCode).toBe(200);
  });

  it("PATCH inexistente → 404", async () => {
    const res = await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/pacientes/${randomUUID()}`, payload: { nombre: "X" } });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe("PACIENTE_NO_ENCONTRADO");
  });

  it("reactivar con email duplicado → 409", async () => {
    await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "Activo", apellido: "A", email: "dup3@demo.local" } });
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
    const res = await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/pacientes/${inactivo.id}`, payload: { activo: true } });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("PACIENTE_DUPLICADO");
  });

  it("reactivar con documento duplicado → 409 PACIENTE_DUPLICADO y permanece inactivo", async () => {
    await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "Activo", apellido: "A", documento: "87654321" } });
    const { randomUUID } = await import("node:crypto");
    const inactivo = {
      id: randomUUID(),
      nombre: "Inactivo",
      apellido: "B",
      documento: "87654321",
      activo: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await repos.pacientes.crear(inactivo as never);
    const res = await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/pacientes/${inactivo.id}`, payload: { activo: true } });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("PACIENTE_DUPLICADO");
    const get = await app.inject({ headers: sesion.headers, method: "GET", url: `/api/pacientes/${inactivo.id}` });
    expect(get.json().activo).toBe(false);
  });

  it("reactivar sin conflicto → queda activo", async () => {
    const r = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "Ana", apellido: "Demo" } });
    const id = r.json().id;
    await app.inject({ headers: sesion.headers, method: "DELETE", url: `/api/pacientes/${id}` });
    const res = await app.inject({ headers: sesion.headers, method: "PATCH", url: `/api/pacientes/${id}`, payload: { activo: true } });
    expect(res.statusCode).toBe(200);
    expect(res.json().activo).toBe(true);
  });

  it("turno con paciente inactivo → 409 RECURSO_INACTIVO", async () => {
    const r = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/pacientes", payload: { nombre: "Inactivo", apellido: "P" } });
    const pid = r.json().id;
    await app.inject({ headers: sesion.headers, method: "DELETE", url: `/api/pacientes/${pid}` });
    const body = {
      pacienteId: pid,
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      prestacionId: SEED_IDS.consulta,
      inicio: "2026-11-18T09:00:00.000Z",
    };
    const res = await app.inject({ headers: sesion.headers, method: "POST", url: "/api/turnos", payload: body });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("RECURSO_INACTIVO");
  });
});
describe("RBAC y scoping en pacientes", () => {
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
      sesiones: new InMemorySessionRepository(),
      bloqueos: new InMemoryBloqueoRepository(),
    };
    await cargarSeed(repos);
    app = buildServer(repos);
  });

  async function crearPaciente(nombre: string) {
    const { headers } = await autenticarseComo(app, "recepcionista");
    const response = await app.inject({
      method: "POST",
      url: "/api/pacientes",
      headers,
      payload: { nombre, apellido: "Demo" },
    });
    return response.json().id as string;
  }

  async function vincular(pacienteId: string, profesionalId: string, estado: "pendiente" | "cancelado" | "atendido" = "pendiente") {
    const inicio = new Date("2026-11-18T09:00:00.000Z");
    await repos.turnos.crear({
      id: randomUUID(),
      pacienteId,
      profesionalId,
      sillonId: SEED_IDS.sillon1,
      prestacionId: SEED_IDS.consulta,
      inicio,
      fin: new Date(inicio.getTime() + 30 * 60 * 1000),
      estado,
      esSobreturno: false,
      createdBy: SEED_IDS.recepcion,
      createdAt: inicio,
      updatedAt: inicio,
    });
  }

  it("todas las rutas exigen sesión", async () => {
    const id = await crearPaciente("SinSesion");

    const respuestas = [
      await app.inject({ method: "POST", url: "/api/pacientes", payload: { nombre: "A", apellido: "B" } }),
      await app.inject({ method: "GET", url: "/api/pacientes" }),
      await app.inject({ method: "GET", url: `/api/pacientes/${id}` }),
      await app.inject({ method: "PATCH", url: `/api/pacientes/${id}`, payload: { nombre: "Otro" } }),
      await app.inject({ method: "DELETE", url: `/api/pacientes/${id}` }),
    ];

    for (const response of respuestas) {
      expect(response.statusCode).toBe(401);
      expect(response.json().code).toBe("NO_AUTENTICADO");
    }
  });

  it("un profesional no puede alta, actualización ni baja", async () => {
    const id = await crearPaciente("Mutaciones");
    const { headers } = await autenticarseComo(app, "profesional");

    const alta = await app.inject({
      method: "POST",
      url: "/api/pacientes",
      headers,
      payload: { nombre: "Nuevo", apellido: "Demo" },
    });
    const patch = await app.inject({ method: "PATCH", url: `/api/pacientes/${id}`, headers, payload: { nombre: "Cambio" } });
    const baja = await app.inject({ method: "DELETE", url: `/api/pacientes/${id}`, headers });

    for (const response of [alta, patch, baja]) {
      expect(response.statusCode).toBe(403);
      expect(response.json().code).toBe("SIN_PERMISO");
    }
  });

  it("el profesional ve solo pacientes vinculados por turnos, en cualquier estado", async () => {
    const propioCancelado = await crearPaciente("PropioCancelado");
    const propioAtendido = await crearPaciente("PropioAtendido");
    const ajeno = await crearPaciente("Ajeno");
    await vincular(propioCancelado, SEED_IDS.profesional1, "cancelado");
    await vincular(propioAtendido, SEED_IDS.profesional1, "atendido");
    await vincular(ajeno, SEED_IDS.profesional2);
    const { headers } = await autenticarseComo(app, "profesional");

    const response = await app.inject({ method: "GET", url: "/api/pacientes", headers });

    expect(response.statusCode).toBe(200);
    expect(response.json().map((p: { id: string }) => p.id).sort()).toEqual(
      [propioCancelado, propioAtendido].sort(),
    );
  });

  it("la búsqueda q del profesional queda acotada a sus pacientes", async () => {
    const propio = await crearPaciente("Visible");
    const ajeno = await crearPaciente("Oculto");
    await vincular(propio, SEED_IDS.profesional1);
    await vincular(ajeno, SEED_IDS.profesional2);
    const { headers } = await autenticarseComo(app, "profesional");

    const response = await app.inject({ method: "GET", url: "/api/pacientes?q=Demo", headers });

    expect(response.statusCode).toBe(200);
    expect(response.json().map((p: { id: string }) => p.id)).toEqual([propio]);
  });

  it("un paciente compartido por dos profesionales es visible para ambos", async () => {
    const compartido = await crearPaciente("Compartido");
    await vincular(compartido, SEED_IDS.profesional1, "cancelado");
    await vincular(compartido, SEED_IDS.profesional2, "atendido");

    for (const idProfesional of [SEED_IDS.profesional1, SEED_IDS.profesional2]) {
      const usuario = await repos.usuarios.buscarPorId(SEED_IDS.odonto1);
      if (!usuario) throw new Error("usuario demo no encontrado");
      await repos.usuarios.crear({ ...usuario, profesionalId: idProfesional });
      const { headers } = await autenticarseComo(app, "profesional");
      const response = await app.inject({ method: "GET", url: "/api/pacientes", headers });

      expect(response.statusCode).toBe(200);
      expect(response.json().map((p: { id: string }) => p.id)).toEqual([compartido]);
    }
  });

  it("la búsqueda sin coincidencias devuelve un arreglo vacío", async () => {
    const paciente = await crearPaciente("Unico");
    await vincular(paciente, SEED_IDS.profesional1);
    const { headers } = await autenticarseComo(app, "profesional");

    const response = await app.inject({ method: "GET", url: "/api/pacientes?q=no-coincide", headers });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it("el detalle de un paciente ajeno responde 403 SIN_PERMISO", async () => {
    const ajeno = await crearPaciente("AjenoDetalle");
    await vincular(ajeno, SEED_IDS.profesional2);
    const { headers } = await autenticarseComo(app, "profesional");

    const response = await app.inject({ method: "GET", url: `/api/pacientes/${ajeno}`, headers });

    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("SIN_PERMISO");
  });

  it("un profesional sin vínculo no ve ningún paciente", async () => {
    const usuario = await repos.usuarios.buscarPorId(SEED_IDS.odonto1);
    if (!usuario) throw new Error("usuario demo no encontrado");
    await repos.usuarios.crear({ ...usuario, profesionalId: undefined });
    const id = await crearPaciente("Cualquiera");
    await vincular(id, SEED_IDS.profesional1);
    const { headers } = await autenticarseComo(app, "profesional");

    const listado = await app.inject({ method: "GET", url: "/api/pacientes", headers });
    const detalle = await app.inject({ method: "GET", url: `/api/pacientes/${id}`, headers });

    expect(listado.statusCode).toBe(200);
    expect(listado.json()).toEqual([]);
    expect(detalle.statusCode).toBe(403);
    expect(detalle.json().code).toBe("SIN_PERMISO");
  });

  it("el detalle de un paciente propio responde 200", async () => {
    const propio = await crearPaciente("PropioDetalle");
    await vincular(propio, SEED_IDS.profesional1);
    const { headers } = await autenticarseComo(app, "profesional");

    const response = await app.inject({ method: "GET", url: `/api/pacientes/${propio}`, headers });

    expect(response.statusCode).toBe(200);
    expect(response.json().id).toBe(propio);
  });

  it("administración y recepción listan pacientes sin scoping", async () => {
    const propio = await crearPaciente("Propio");
    const ajeno = await crearPaciente("Ajeno");
    await vincular(propio, SEED_IDS.profesional1);
    await vincular(ajeno, SEED_IDS.profesional2);

    for (const rol of ["administrador", "recepcionista"] as const) {
      const { headers } = await autenticarseComo(app, rol);
      const response = await app.inject({ method: "GET", url: "/api/pacientes", headers });

      expect(response.statusCode).toBe(200);
      const ids = response.json().map((p: { id: string }) => p.id);
      expect(ids).toContain(propio);
      expect(ids).toContain(ajeno);
    }
  });

  it("la denegación de baja no cambia el activo del paciente", async () => {
    const id = await crearPaciente("SigueActivo");
    await vincular(id, SEED_IDS.profesional2);
    const { headers } = await autenticarseComo(app, "profesional");

    const response = await app.inject({ method: "DELETE", url: `/api/pacientes/${id}`, headers });

    expect(response.statusCode).toBe(403);
    expect((await repos.pacientes.buscarPorId(id))!.activo).toBe(true);
  });
});
