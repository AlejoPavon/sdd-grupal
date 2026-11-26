import { beforeEach, describe, expect, it } from "vitest";

import { ListarTurnos, ObtenerTurno } from "../../../src/application/turnos/listar-turnos.js";
import type { Repositorios } from "../../../src/application/ports/repositorios.js";
import { InMemoryBloqueoRepository } from "../../../src/infrastructure/persistence/in-memory-bloqueo-repository.js";
import { InMemorySessionRepository } from "../../../src/infrastructure/persistence/in-memory-session-repository.js";
import { InMemoryPacienteRepository } from "../../../src/infrastructure/persistence/in-memory-paciente-repository.js";
import { InMemoryPrestacionRepository } from "../../../src/infrastructure/persistence/in-memory-prestacion-repository.js";
import { InMemoryProfesionalRepository } from "../../../src/infrastructure/persistence/in-memory-profesional-repository.js";
import { InMemorySillonRepository } from "../../../src/infrastructure/persistence/in-memory-sillon-repository.js";
import { InMemoryTurnoRepository } from "../../../src/infrastructure/persistence/in-memory-turno-repository.js";
import { InMemoryUsuarioRepository } from "../../../src/infrastructure/persistence/in-memory-usuario-repository.js";
import { cargarSeed, SEED_IDS } from "../../../src/infrastructure/seed.js";
import { CrearTurno } from "../../../src/application/crear-turno.js";
import { RangoInvalidoError, RecursoNoEncontradoError } from "../../../src/domain/turno/turno.errors.js";

describe("ListarTurnos", () => {
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

  async function crearTurno(inicio: string, overrides: Record<string, unknown> = {}) {
    const crear = new CrearTurno(repos);
    return crear.execute({
      pacienteId: SEED_IDS.paciente1,
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      prestacionId: SEED_IDS.consulta,
      inicio: new Date(inicio),
      creadoPor: SEED_IDS.recepcion,
      ...overrides,
    });
  }

  it("lanza RANGO_INVALIDO si desde >= hasta", async () => {
    const listar = new ListarTurnos(repos);
    await expect(
      listar.execute(new Date("2027-01-15T10:00:00.000Z"), new Date("2027-01-15T09:00:00.000Z")),
    ).rejects.toBeInstanceOf(RangoInvalidoError);
    try {
      await listar.execute(new Date("2027-01-15T10:00:00.000Z"), new Date("2027-01-15T10:00:00.000Z"));
    } catch (e) {
      expect((e as RangoInvalidoError).code).toBe("RANGO_INVALIDO");
    }
  });

  it("filtra por rango y ordena por inicio", async () => {
    await crearTurno("2027-01-15T11:00:00.000Z");
    await crearTurno("2027-01-15T09:00:00.000Z");

    const listar = new ListarTurnos(repos);
    const result = await listar.execute({
      desde: new Date("2027-01-15T08:00:00.000Z"),
      hasta: new Date("2027-01-15T12:00:00.000Z"),
    });
    expect(result).toHaveLength(2);
    expect(new Date(result[0]!.inicio).getTime()).toBeLessThan(new Date(result[1]!.inicio).getTime());
  });

  it("filtra combinado por profesional y sillón", async () => {
    await crearTurno("2027-01-15T09:00:00.000Z");
    const crear = new CrearTurno(repos);
    await crear.execute({
      pacienteId: SEED_IDS.paciente2,
      profesionalId: SEED_IDS.profesional2,
      sillonId: SEED_IDS.sillon2,
      prestacionId: SEED_IDS.consulta,
      inicio: new Date("2027-01-15T09:00:00.000Z"),
      creadoPor: SEED_IDS.recepcion,
    });

    const listar = new ListarTurnos(repos);
    const result = await listar.execute({
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.profesionalId).toBe(SEED_IDS.profesional1);
    expect(result[0]!.sillonId).toBe(SEED_IDS.sillon1);
  });

  it("incluye turnos cancelados en la lista general", async () => {
    const turno = await crearTurno("2027-01-15T09:00:00.000Z");
    await repos.turnos.actualizar({ ...turno, estado: "cancelado" });

    const listar = new ListarTurnos(repos);
    const result = await listar.execute();
    expect(result).toHaveLength(1);
    expect(result[0]!.estado).toBe("cancelado");
  });

  it("filtra por paciente", async () => {
    await crearTurno("2027-01-15T09:00:00.000Z");
    await crearTurno("2027-01-15T10:00:00.000Z", { pacienteId: SEED_IDS.paciente2 });

    const listar = new ListarTurnos(repos);
    const result = await listar.execute({ pacienteId: SEED_IDS.paciente1 });
    expect(result).toHaveLength(1);
    expect(result[0]!.pacienteId).toBe(SEED_IDS.paciente1);
  });

  it("enriquece con paciente y prestacion", async () => {
    await crearTurno("2027-01-15T09:00:00.000Z");
    const listar = new ListarTurnos(repos);
    const result = await listar.execute();
    expect(result[0]!.paciente).toEqual({
      id: SEED_IDS.paciente1,
      nombre: "Paciente",
      apellido: "Demo Uno",
    });
    expect(result[0]!.prestacion).toMatchObject({
      id: SEED_IDS.consulta,
      codigo: "CONSULTA",
      nombre: "Consulta",
      duracionMinutos: 30,
    });
  });
});

describe("ObtenerTurno", () => {
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

  it("lanza TURNO_NO_ENCONTRADO si no existe", async () => {
    const obtener = new ObtenerTurno(repos);
    await expect(obtener.execute("no-existe")).rejects.toBeInstanceOf(RecursoNoEncontradoError);
    try {
      await obtener.execute("no-existe");
    } catch (e) {
      expect((e as RecursoNoEncontradoError).code).toBe("TURNO_NO_ENCONTRADO");
    }
  });
});