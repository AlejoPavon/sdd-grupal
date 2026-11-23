import { beforeEach, describe, expect, it } from "vitest";

import { CrearBloqueo } from "../../../../src/application/bloqueos/crear-bloqueo.js";
import type { Repositorios } from "../../../../src/application/ports/repositorios.js";
import {
  BloqueoIntervaloInvalidoError,
  BloqueoMotivoRequeridoError,
  BloqueoRecursoRequeridoError,
} from "../../../../src/domain/bloqueo/bloqueo.errors.js";
import {
  RecursoInactivoError,
  RecursoNoEncontradoError,
} from "../../../../src/domain/turno/turno.errors.js";
import { InMemoryBloqueoRepository } from "../../../../src/infrastructure/persistence/in-memory-bloqueo-repository.js";
import { InMemoryPacienteRepository } from "../../../../src/infrastructure/persistence/in-memory-paciente-repository.js";
import { InMemoryPrestacionRepository } from "../../../../src/infrastructure/persistence/in-memory-prestacion-repository.js";
import { InMemoryProfesionalRepository } from "../../../../src/infrastructure/persistence/in-memory-profesional-repository.js";
import { InMemorySessionRepository } from "../../../../src/infrastructure/persistence/in-memory-session-repository.js";
import { InMemorySillonRepository } from "../../../../src/infrastructure/persistence/in-memory-sillon-repository.js";
import { InMemoryTurnoRepository } from "../../../../src/infrastructure/persistence/in-memory-turno-repository.js";
import { InMemoryUsuarioRepository } from "../../../../src/infrastructure/persistence/in-memory-usuario-repository.js";
import { cargarSeed, SEED_IDS } from "../../../../src/infrastructure/seed.js";

const INICIO = new Date("2026-11-18T09:00:00.000Z");
const FIN = new Date("2026-11-18T09:30:00.000Z");
const ID_INEXISTENTE = "00000000-0000-4000-8000-000000000099";

describe("CrearBloqueo", () => {
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
  });

  const crear = (input: Partial<Parameters<CrearBloqueo["execute"]>[0]> = {}) =>
    new CrearBloqueo(repos).execute({
      profesionalId: SEED_IDS.profesional1,
      inicio: INICIO,
      fin: FIN,
      motivo: "Cirugía",
      creadoPor: SEED_IDS.admin,
      ...input,
    });

  it("crea un bloqueo con id UUID, createdAt y creadoPor de la sesión", async () => {
    const bloqueo = await crear();

    expect(bloqueo.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(bloqueo.profesionalId).toBe(SEED_IDS.profesional1);
    expect(bloqueo.inicio).toEqual(INICIO);
    expect(bloqueo.fin).toEqual(FIN);
    expect(bloqueo.motivo).toBe("Cirugía");
    expect(bloqueo.creadoPor).toBe(SEED_IDS.admin);
    expect(bloqueo.createdAt).toBeInstanceOf(Date);
    expect(await repos.bloqueos.buscarPorId(bloqueo.id)).toEqual(bloqueo);
  });

  it("rechaza profesional inexistente sin persistir", async () => {
    let error: unknown;
    try {
      await crear({ profesionalId: ID_INEXISTENTE });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(RecursoNoEncontradoError);
    expect((error as RecursoNoEncontradoError).code).toBe("PROFESIONAL_NO_ENCONTRADO");
    expect(await repos.bloqueos.listar()).toEqual([]);
  });

  it("rechaza sillón inexistente sin persistir", async () => {
    let error: unknown;
    try {
      await crear({ profesionalId: undefined, sillonId: ID_INEXISTENTE });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(RecursoNoEncontradoError);
    expect((error as RecursoNoEncontradoError).code).toBe("SILLON_NO_ENCONTRADO");
    expect(await repos.bloqueos.listar()).toEqual([]);
  });

  it.each([
    ["profesional", { profesionalId: SEED_IDS.profesional2 }],
    ["sillón", { profesionalId: undefined, sillonId: SEED_IDS.sillon2 }],
  ])("rechaza %s inactivo sin persistir", async (_recurso, input) => {
    if (input.profesionalId) {
      const profesional = await repos.profesionales.buscarPorId(input.profesionalId);
      if (!profesional) throw new Error("profesional base no encontrado");
      await repos.profesionales.crear({ ...profesional, activo: false });
    } else if (input.sillonId) {
      const sillon = await repos.sillones.buscarPorId(input.sillonId);
      if (!sillon) throw new Error("sillón base no encontrado");
      await repos.sillones.crear({ ...sillon, activo: false });
    }

    let error: unknown;
    try {
      await crear(input);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(RecursoInactivoError);
    expect((error as RecursoInactivoError).code).toBe("RECURSO_INACTIVO");
    expect(await repos.bloqueos.listar()).toEqual([]);
  });

  it("rechaza bloqueo sin recurso, con intervalo inválido o motivo vacío", async () => {
    await expect(crear({ profesionalId: undefined })).rejects.toBeInstanceOf(BloqueoRecursoRequeridoError);
    await expect(crear({ fin: INICIO })).rejects.toBeInstanceOf(BloqueoIntervaloInvalidoError);
    await expect(crear({ motivo: "  " })).rejects.toBeInstanceOf(BloqueoMotivoRequeridoError);
    expect(await repos.bloqueos.listar()).toEqual([]);
  });

  it("crea un bloqueo con profesional y sillón a la vez (triangulación)", async () => {
    const bloqueo = await crear({ sillonId: SEED_IDS.sillon2 });

    expect(bloqueo.profesionalId).toBe(SEED_IDS.profesional1);
    expect(bloqueo.sillonId).toBe(SEED_IDS.sillon2);
    expect(await repos.bloqueos.listar()).toHaveLength(1);
  });
});
