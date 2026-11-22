import { beforeEach, describe, expect, it } from "vitest";

import { CrearTurno } from "../../../src/application/crear-turno.js";
import type { Repositorios } from "../../../src/application/ports/repositorios.js";
import { InMemoryPacienteRepository } from "../../../src/infrastructure/persistence/in-memory-paciente-repository.js";
import { InMemoryPrestacionRepository } from "../../../src/infrastructure/persistence/in-memory-prestacion-repository.js";
import { InMemoryProfesionalRepository } from "../../../src/infrastructure/persistence/in-memory-profesional-repository.js";
import { InMemorySillonRepository } from "../../../src/infrastructure/persistence/in-memory-sillon-repository.js";
import { InMemoryTurnoRepository } from "../../../src/infrastructure/persistence/in-memory-turno-repository.js";
import { InMemoryUsuarioRepository } from "../../../src/infrastructure/persistence/in-memory-usuario-repository.js";
import { cargarSeed, SEED_IDS } from "../../../src/infrastructure/seed.js";
import {
  RecursoInactivoError,
  RecursoNoEncontradoError,
  TurnoSolapadoError,
} from "../../../src/domain/turno/turno.errors.js";

describe("CrearTurno", () => {
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
  });

  it("crea un turno válido en estado pendiente con fin calculado y trazabilidad", async () => {
    const crearTurno = new CrearTurno(repos);
    const inicio = new Date("2026-11-18T09:00:00.000Z");

    const turno = await crearTurno.execute({
      pacienteId: SEED_IDS.paciente1,
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      prestacionId: SEED_IDS.consulta,
      inicio,
      creadoPor: SEED_IDS.recepcion,
    });

    expect(turno.estado).toBe("pendiente");
    expect(turno.inicio).toEqual(inicio);
    expect(turno.fin).toEqual(new Date("2026-11-18T09:30:00.000Z"));
    expect(turno.createdBy).toBe(SEED_IDS.recepcion);
    expect(turno.createdAt).toBeInstanceOf(Date);
    expect(turno.updatedAt).toBeInstanceOf(Date);
    expect(turno.id).toBeTruthy();

    const persistidos = await repos.turnos.listar();
    expect(persistidos).toHaveLength(1);
  });

  it("rechaza solapamiento por profesional y no persiste el nuevo turno", async () => {
    const crearTurno = new CrearTurno(repos);
    const inicio1 = new Date("2026-11-18T09:00:00.000Z");
    await crearTurno.execute({
      pacienteId: SEED_IDS.paciente1,
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      prestacionId: SEED_IDS.consulta,
      inicio: inicio1,
      creadoPor: SEED_IDS.recepcion,
    });

    const inicio2 = new Date("2026-11-18T09:15:00.000Z");
    await expect(
      crearTurno.execute({
        pacienteId: SEED_IDS.paciente2,
        profesionalId: SEED_IDS.profesional1,
        sillonId: SEED_IDS.sillon2,
        prestacionId: SEED_IDS.consulta,
        inicio: inicio2,
        creadoPor: SEED_IDS.recepcion,
      }),
    ).rejects.toBeInstanceOf(TurnoSolapadoError);

    try {
      await crearTurno.execute({
        pacienteId: SEED_IDS.paciente2,
        profesionalId: SEED_IDS.profesional1,
        sillonId: SEED_IDS.sillon2,
        prestacionId: SEED_IDS.consulta,
        inicio: inicio2,
        creadoPor: SEED_IDS.recepcion,
      });
    } catch (e) {
      const err = e as TurnoSolapadoError;
      expect(err.code).toBe("TURNO_SOLAPADO_PROFESIONAL");
      expect(err.turnoEnConflicto.id).toBeTruthy();
    }

    const persistidos = await repos.turnos.listar();
    expect(persistidos).toHaveLength(1);
  });

  it("rechaza solapamiento por sillón", async () => {
    const crearTurno = new CrearTurno(repos);
    const inicio1 = new Date("2026-11-18T09:00:00.000Z");
    await crearTurno.execute({
      pacienteId: SEED_IDS.paciente1,
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      prestacionId: SEED_IDS.consulta,
      inicio: inicio1,
      creadoPor: SEED_IDS.recepcion,
    });

    const inicio2 = new Date("2026-11-18T09:15:00.000Z");
    try {
      await crearTurno.execute({
        pacienteId: SEED_IDS.paciente2,
        profesionalId: SEED_IDS.profesional2,
        sillonId: SEED_IDS.sillon1,
        prestacionId: SEED_IDS.consulta,
        inicio: inicio2,
        creadoPor: SEED_IDS.recepcion,
      });
    } catch (e) {
      const err = e as TurnoSolapadoError;
      expect(err.code).toBe("TURNO_SOLAPADO_SILLON");
    }
  });

  it("permite turnos contiguos", async () => {
    const crearTurno = new CrearTurno(repos);
    await crearTurno.execute({
      pacienteId: SEED_IDS.paciente1,
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      prestacionId: SEED_IDS.consulta,
      inicio: new Date("2026-11-18T09:00:00.000Z"),
      creadoPor: SEED_IDS.recepcion,
    });

    const segundo = await crearTurno.execute({
      pacienteId: SEED_IDS.paciente2,
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      prestacionId: SEED_IDS.consulta,
      inicio: new Date("2026-11-18T09:30:00.000Z"),
      creadoPor: SEED_IDS.recepcion,
    });

    expect(segundo.estado).toBe("pendiente");
    const persistidos = await repos.turnos.listar();
    expect(persistidos).toHaveLength(2);
  });

  it("rechaza recurso inactivo", async () => {
    await repos.profesionales.crear({
      id: "prof-inactivo",
      nombre: "Inactivo",
      apellido: "Demo",
      matricula: "INACTIVO",
      especialidades: [],
      activo: false,
    });

    const crearTurno = new CrearTurno(repos);
    await expect(
      crearTurno.execute({
        pacienteId: SEED_IDS.paciente1,
        profesionalId: "prof-inactivo",
        sillonId: SEED_IDS.sillon1,
        prestacionId: SEED_IDS.consulta,
        inicio: new Date("2026-11-18T09:00:00.000Z"),
        creadoPor: SEED_IDS.recepcion,
      }),
    ).rejects.toBeInstanceOf(RecursoInactivoError);
  });

  it("rechaza recurso inexistente", async () => {
    const crearTurno = new CrearTurno(repos);
    await expect(
      crearTurno.execute({
        pacienteId: "no-existe",
        profesionalId: SEED_IDS.profesional1,
        sillonId: SEED_IDS.sillon1,
        prestacionId: SEED_IDS.consulta,
        inicio: new Date("2026-11-18T09:00:00.000Z"),
        creadoPor: SEED_IDS.recepcion,
      }),
    ).rejects.toBeInstanceOf(RecursoNoEncontradoError);
  });
});