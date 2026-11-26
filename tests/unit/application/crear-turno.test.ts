import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";

import { CrearTurno } from "../../../src/application/crear-turno.js";
import { crearBloqueo } from "../../../src/domain/bloqueo/bloqueo.js";
import { TurnoBloqueadoError } from "../../../src/domain/bloqueo/bloqueo.errors.js";
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
import {
  RecursoInactivoError,
  RecursoNoEncontradoError,
  TurnoEnElPasadoError,
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
      sesiones: new InMemorySessionRepository(),
      bloqueos: new InMemoryBloqueoRepository(),
    };
    await cargarSeed(repos);
  });

  it("crea un turno válido en estado pendiente con fin calculado y trazabilidad", async () => {
    const crearTurno = new CrearTurno(repos);
    const inicio = new Date("2027-01-15T09:00:00.000Z");

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
    expect(turno.fin).toEqual(new Date("2027-01-15T09:30:00.000Z"));
    expect(turno.createdBy).toBe(SEED_IDS.recepcion);
    expect(turno.createdAt).toBeInstanceOf(Date);
    expect(turno.updatedAt).toBeInstanceOf(Date);
    expect(turno.id).toBeTruthy();

    const persistidos = await repos.turnos.listar();
    expect(persistidos).toHaveLength(1);
  });

  it("rechaza solapamiento por profesional y no persiste el nuevo turno", async () => {
    const crearTurno = new CrearTurno(repos);
    const inicio1 = new Date("2027-01-15T09:00:00.000Z");
    await crearTurno.execute({
      pacienteId: SEED_IDS.paciente1,
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      prestacionId: SEED_IDS.consulta,
      inicio: inicio1,
      creadoPor: SEED_IDS.recepcion,
    });

    const inicio2 = new Date("2027-01-15T09:15:00.000Z");
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
    const inicio1 = new Date("2027-01-15T09:00:00.000Z");
    await crearTurno.execute({
      pacienteId: SEED_IDS.paciente1,
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      prestacionId: SEED_IDS.consulta,
      inicio: inicio1,
      creadoPor: SEED_IDS.recepcion,
    });

    const inicio2 = new Date("2027-01-15T09:15:00.000Z");
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
      inicio: new Date("2027-01-15T09:00:00.000Z"),
      creadoPor: SEED_IDS.recepcion,
    });

    const segundo = await crearTurno.execute({
      pacienteId: SEED_IDS.paciente2,
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      prestacionId: SEED_IDS.consulta,
      inicio: new Date("2027-01-15T09:30:00.000Z"),
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
        inicio: new Date("2027-01-15T09:00:00.000Z"),
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
        inicio: new Date("2027-01-15T09:00:00.000Z"),
        creadoPor: SEED_IDS.recepcion,
      }),
    ).rejects.toBeInstanceOf(RecursoNoEncontradoError);
  });

  async function bloquear(input: {
    profesionalId?: string;
    sillonId?: string;
    inicio: string;
    fin: string;
  }) {
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

  const turnoBase = {
    pacienteId: SEED_IDS.paciente1,
    profesionalId: SEED_IDS.profesional1,
    sillonId: SEED_IDS.sillon1,
    prestacionId: SEED_IDS.consulta,
    creadoPor: SEED_IDS.admin,
  };

  it("rechaza un turno por bloqueo del profesional con details.bloqueo", async () => {
    const bloqueo = await bloquear({
      profesionalId: SEED_IDS.profesional1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });

    let error: unknown;
    try {
      await new CrearTurno(repos).execute({
        ...turnoBase,
        inicio: new Date("2027-01-15T09:30:00.000Z"),
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(TurnoBloqueadoError);
    const tipado = error as TurnoBloqueadoError;
    expect(tipado.code).toBe("TURNO_BLOQUEADO");
    expect(tipado.details.bloqueo).toMatchObject({
      id: bloqueo.id,
      inicio: bloqueo.inicio,
      fin: bloqueo.fin,
    });
    expect(await repos.turnos.listar()).toEqual([]);
  });

  it("rechaza un turno por bloqueo del sillón", async () => {
    await bloquear({
      sillonId: SEED_IDS.sillon1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });

    await expect(
      new CrearTurno(repos).execute({ ...turnoBase, inicio: new Date("2027-01-15T09:30:00.000Z") }),
    ).rejects.toBeInstanceOf(TurnoBloqueadoError);
  });

  it("da prioridad al bloqueo del profesional cuando ambos están bloqueados", async () => {
    const bloqueoProfesional = await bloquear({
      profesionalId: SEED_IDS.profesional1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });
    const bloqueoSillon = await bloquear({
      sillonId: SEED_IDS.sillon1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });

    try {
      await new CrearTurno(repos).execute({
        ...turnoBase,
        inicio: new Date("2027-01-15T09:30:00.000Z"),
      });
      throw new Error("debió rechazarse");
    } catch (e) {
      expect(e).toBeInstanceOf(TurnoBloqueadoError);
      expect((e as TurnoBloqueadoError).bloqueo.id).toBe(bloqueoProfesional.id);
      expect((e as TurnoBloqueadoError).bloqueo.id).not.toBe(bloqueoSillon.id);
    }
  });

  it("permite turnos contiguos al bloqueo en ambos extremos", async () => {
    await bloquear({
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T09:30:00.000Z",
    });
    await bloquear({
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      inicio: "2027-01-15T10:00:00.000Z",
      fin: "2027-01-15T11:00:00.000Z",
    });

    const crear = new CrearTurno(repos);
    const contiguo = await crear.execute({ ...turnoBase, inicio: new Date("2027-01-15T09:30:00.000Z") });

    expect(contiguo.inicio.toISOString()).toBe("2027-01-15T09:30:00.000Z");
    expect(contiguo.fin.toISOString()).toBe("2027-01-15T10:00:00.000Z");
    expect(await repos.turnos.listar()).toHaveLength(1);
  });

  it("respeta la precedencia de solapamientos por encima de los bloqueos", async () => {
    await bloquear({
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });
    const crear = new CrearTurno(repos);
    await crear.execute({
      ...turnoBase,
      inicio: new Date("2027-01-15T09:00:00.000Z"),
      forzar: true,
      autorizadoPor: SEED_IDS.admin,
    });

    try {
      await crear.execute({
        ...turnoBase,
        pacienteId: SEED_IDS.paciente2,
        inicio: new Date("2027-01-15T09:00:00.000Z"),
      });
      throw new Error("debió rechazarse");
    } catch (e) {
      expect(e).toBeInstanceOf(TurnoSolapadoError);
      expect((e as TurnoSolapadoError).code).toBe("TURNO_SOLAPADO_PROFESIONAL");
    }

    try {
      await crear.execute({
        ...turnoBase,
        pacienteId: SEED_IDS.paciente2,
        profesionalId: SEED_IDS.profesional2,
        inicio: new Date("2027-01-15T09:00:00.000Z"),
      });
      throw new Error("debió rechazarse");
    } catch (e) {
      expect(e).toBeInstanceOf(TurnoSolapadoError);
      expect((e as TurnoSolapadoError).code).toBe("TURNO_SOLAPADO_SILLON");
    }
  });

  it("ignora bloqueos de otros profesionales y sillones y rechaza solapación mínima", async () => {
    await bloquear({
      profesionalId: SEED_IDS.profesional2,
      sillonId: SEED_IDS.sillon2,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });

    const crear = new CrearTurno(repos);
    const turno = await crear.execute({ ...turnoBase, inicio: new Date("2027-01-15T09:00:00.000Z") });
    expect(turno.estado).toBe("pendiente");

    await bloquear({
      profesionalId: SEED_IDS.profesional1,
      inicio: "2027-01-15T09:29:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });
    await expect(
      crear.execute({
        ...turnoBase,
        pacienteId: SEED_IDS.paciente2,
        sillonId: SEED_IDS.sillon2,
        inicio: new Date("2027-01-15T09:30:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(TurnoBloqueadoError);
  });

  it("forzar con bloqueo registra autorizadoPor y sin bloqueo no lo registra", async () => {
    await bloquear({
      profesionalId: SEED_IDS.profesional1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });

    const crear = new CrearTurno(repos);
    const forzado = await crear.execute({
      ...turnoBase,
      inicio: new Date("2027-01-15T09:30:00.000Z"),
      forzar: true,
      autorizadoPor: SEED_IDS.admin,
    });

    expect(forzado.autorizadoPor).toBe(SEED_IDS.admin);
    expect(forzado.esSobreturno).toBe(false);

    const sinConflicto = await crear.execute({
      ...turnoBase,
      pacienteId: SEED_IDS.paciente2,
      inicio: new Date("2027-01-15T10:00:00.000Z"),
      forzar: true,
      autorizadoPor: SEED_IDS.admin,
    });
    expect(sinConflicto.autorizadoPor).toBeUndefined();
  });

  it("forzar no omit solapamientos con turnos existentes", async () => {
    const crear = new CrearTurno(repos);
    await crear.execute({ ...turnoBase, inicio: new Date("2027-01-15T09:00:00.000Z") });

    await expect(
      crear.execute({
        ...turnoBase,
        pacienteId: SEED_IDS.paciente2,
        inicio: new Date("2027-01-15T09:15:00.000Z"),
        forzar: true,
        autorizadoPor: SEED_IDS.admin,
      }),
    ).rejects.toBeInstanceOf(TurnoSolapadoError);
  });

  it("un turno cancelado del profesional no bloquea la creación", async () => {
    const crear = new CrearTurno(repos);
    const cancelado = await crear.execute({ ...turnoBase, inicio: new Date("2027-01-15T09:00:00.000Z") });
    await repos.turnos.actualizar({ ...cancelado, estado: "cancelado" });

    const nuevo = await crear.execute({
      ...turnoBase,
      pacienteId: SEED_IDS.paciente2,
      sillonId: SEED_IDS.sillon2,
      inicio: new Date("2027-01-15T09:00:00.000Z"),
    });

    expect(nuevo.estado).toBe("pendiente");
    const turnos = await repos.turnos.listar();
    expect(turnos).toHaveLength(2);
    expect(turnos.find((turno) => turno.id === cancelado.id)?.estado).toBe("cancelado");
    expect(turnos.find((turno) => turno.id === nuevo.id)?.estado).toBe("pendiente");
  });

  it("crea un sobreturno sobre un turno activo del profesional y registra autorizadoPor", async () => {
    const crear = new CrearTurno(repos);
    const original = await crear.execute({ ...turnoBase, inicio: new Date("2027-01-15T09:00:00.000Z") });

    const sobreturno = await crear.execute({
      ...turnoBase,
      pacienteId: SEED_IDS.paciente2,
      sillonId: SEED_IDS.sillon2,
      inicio: new Date("2027-01-15T09:15:00.000Z"),
      esSobreturno: true,
      autorizadoPor: SEED_IDS.admin,
    });

    expect(sobreturno.esSobreturno).toBe(true);
    expect(sobreturno.autorizadoPor).toBe(SEED_IDS.admin);
    expect(sobreturno.estado).toBe("pendiente");
    expect((await repos.turnos.listar()).map((turno) => turno.id)).toEqual([
      original.id,
      sobreturno.id,
    ]);
  });

  it("crea un sobreturno sobre un bloqueo del profesional con sillón libre", async () => {
    const bloqueo = await bloquear({
      profesionalId: SEED_IDS.profesional1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });

    const sobreturno = await new CrearTurno(repos).execute({
      ...turnoBase,
      inicio: new Date("2027-01-15T09:30:00.000Z"),
      esSobreturno: true,
      autorizadoPor: SEED_IDS.recepcion,
    });

    expect(sobreturno.esSobreturno).toBe(true);
    expect(sobreturno.autorizadoPor).toBe(SEED_IDS.recepcion);
    expect(sobreturno.fin.toISOString()).toBe("2027-01-15T10:00:00.000Z");
    expect(await repos.turnos.listar()).toHaveLength(1);
    expect(bloqueo.profesionalId).toBe(SEED_IDS.profesional1);
  });

  it("esSobreturno: false mantiene el rechazo por solapamiento profesional", async () => {
    const crear = new CrearTurno(repos);
    await crear.execute({ ...turnoBase, inicio: new Date("2027-01-15T09:00:00.000Z") });

    await expect(
      crear.execute({
        ...turnoBase,
        pacienteId: SEED_IDS.paciente2,
        sillonId: SEED_IDS.sillon2,
        inicio: new Date("2027-01-15T09:15:00.000Z"),
        esSobreturno: false,
        autorizadoPor: SEED_IDS.admin,
      }),
    ).rejects.toMatchObject({ code: "TURNO_SOLAPADO_PROFESIONAL" });
    expect(await repos.turnos.listar()).toHaveLength(1);
  });

  it("esSobreturno: false mantiene el rechazo por bloqueo profesional", async () => {
    await bloquear({
      profesionalId: SEED_IDS.profesional1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });

    await expect(
      new CrearTurno(repos).execute({
        ...turnoBase,
        inicio: new Date("2027-01-15T09:30:00.000Z"),
        esSobreturno: false,
        autorizadoPor: SEED_IDS.admin,
      }),
    ).rejects.toMatchObject({ code: "TURNO_BLOQUEADO" });
    expect(await repos.turnos.listar()).toEqual([]);
  });

  it("un bloqueo de otro profesional no afecta al sobreturno", async () => {
    await bloquear({
      profesionalId: SEED_IDS.profesional2,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });

    const sobreturno = await new CrearTurno(repos).execute({
      ...turnoBase,
      inicio: new Date("2027-01-15T09:00:00.000Z"),
      esSobreturno: true,
      autorizadoPor: SEED_IDS.recepcion,
    });

    expect(sobreturno.esSobreturno).toBe(true);
    expect(sobreturno.autorizadoPor).toBe(SEED_IDS.recepcion);
    expect(await repos.turnos.listar()).toHaveLength(1);
  });

  it("un sobreturno sin conflicto persiste un único turno pero igual queda auditado", async () => {
    const turno = await new CrearTurno(repos).execute({
      ...turnoBase,
      inicio: new Date("2027-01-15T09:00:00.000Z"),
      esSobreturno: true,
      autorizadoPor: SEED_IDS.admin,
    });

    expect(turno.esSobreturno).toBe(true);
    expect(turno.autorizadoPor).toBe(SEED_IDS.admin);
    expect(await repos.turnos.listar()).toHaveLength(1);
  });

  it("un turno normal sin flags no persiste autorizadoPor", async () => {
    const turno = await new CrearTurno(repos).execute({
      ...turnoBase,
      inicio: new Date("2027-01-15T09:00:00.000Z"),
      autorizadoPor: SEED_IDS.admin,
    });

    expect(turno.esSobreturno).toBe(false);
    expect(turno.autorizadoPor).toBeUndefined();
  });

  it("un sobreturno nunca omite el solapamiento de sillón", async () => {
    const crear = new CrearTurno(repos);
    const ocupado = await crear.execute({ ...turnoBase, inicio: new Date("2027-01-15T09:00:00.000Z") });

    let error: unknown;
    try {
      await crear.execute({
        ...turnoBase,
        pacienteId: SEED_IDS.paciente2,
        inicio: new Date("2027-01-15T09:15:00.000Z"),
        esSobreturno: true,
        autorizadoPor: SEED_IDS.admin,
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(TurnoSolapadoError);
    const tipado = error as TurnoSolapadoError;
    expect(tipado.code).toBe("TURNO_SOLAPADO_SILLON");
    expect(tipado.turnoEnConflicto.id).toBe(ocupado.id);
    expect(await repos.turnos.listar()).toHaveLength(1);
  });

  it("un sobreturno nunca omite el bloqueo de sillón y lo identifica en details", async () => {
    const bloqueo = await bloquear({
      sillonId: SEED_IDS.sillon1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });

    let error: unknown;
    try {
      await new CrearTurno(repos).execute({
        ...turnoBase,
        inicio: new Date("2027-01-15T09:30:00.000Z"),
        esSobreturno: true,
        autorizadoPor: SEED_IDS.admin,
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(TurnoBloqueadoError);
    expect((error as TurnoBloqueadoError).details.bloqueo.id).toBe(bloqueo.id);
    expect(await repos.turnos.listar()).toEqual([]);
  });

  it("esSobreturno y forzar juntos siguen rechazando el solapamiento de sillón", async () => {
    const crear = new CrearTurno(repos);
    await crear.execute({ ...turnoBase, inicio: new Date("2027-01-15T09:00:00.000Z") });

    await expect(
      crear.execute({
        ...turnoBase,
        pacienteId: SEED_IDS.paciente2,
        inicio: new Date("2027-01-15T09:15:00.000Z"),
        esSobreturno: true,
        forzar: true,
        autorizadoPor: SEED_IDS.admin,
      }),
    ).rejects.toMatchObject({ code: "TURNO_SOLAPADO_SILLON" });
    expect(await repos.turnos.listar()).toHaveLength(1);
  });

  it("da precedencia al sillón aunque el profesional también tenga turno solapado", async () => {
    const crear = new CrearTurno(repos);
    await crear.execute({ ...turnoBase, inicio: new Date("2027-01-15T09:00:00.000Z") });

    await expect(
      crear.execute({
        ...turnoBase,
        pacienteId: SEED_IDS.paciente2,
        inicio: new Date("2027-01-15T09:15:00.000Z"),
        esSobreturno: true,
        autorizadoPor: SEED_IDS.admin,
      }),
    ).rejects.toMatchObject({ code: "TURNO_SOLAPADO_SILLON" });
  });

  it("un sobreturno contiguo a turno y bloqueo del sillón se permite", async () => {
    const crear = new CrearTurno(repos);
    await crear.execute({ ...turnoBase, inicio: new Date("2027-01-15T09:00:00.000Z") });
    await bloquear({
      sillonId: SEED_IDS.sillon1,
      inicio: "2027-01-15T10:00:00.000Z",
      fin: "2027-01-15T11:00:00.000Z",
    });

    const contiguo = await crear.execute({
      ...turnoBase,
      pacienteId: SEED_IDS.paciente2,
      inicio: new Date("2027-01-15T09:30:00.000Z"),
      esSobreturno: true,
      autorizadoPor: SEED_IDS.admin,
    });

    expect(contiguo.inicio.toISOString()).toBe("2027-01-15T09:30:00.000Z");
    expect(contiguo.fin.toISOString()).toBe("2027-01-15T10:00:00.000Z");
    expect(await repos.turnos.listar()).toHaveLength(2);
  });

  it("un sobreturno con superposición de un minuto en el sillón se rechaza", async () => {
    const crear = new CrearTurno(repos);
    await crear.execute({ ...turnoBase, inicio: new Date("2027-01-15T09:00:00.000Z") });

    await expect(
      crear.execute({
        ...turnoBase,
        pacienteId: SEED_IDS.paciente2,
        inicio: new Date("2027-01-15T09:29:00.000Z"),
        esSobreturno: true,
        autorizadoPor: SEED_IDS.admin,
      }),
    ).rejects.toMatchObject({ code: "TURNO_SOLAPADO_SILLON" });
    expect(await repos.turnos.listar()).toHaveLength(1);
  });

  it("forzar con sobreturno omite solo el bloqueo de sillón y lo audita", async () => {
    const bloqueo = await bloquear({
      sillonId: SEED_IDS.sillon1,
      inicio: "2027-01-15T09:00:00.000Z",
      fin: "2027-01-15T10:00:00.000Z",
    });

    const turno = await new CrearTurno(repos).execute({
      ...turnoBase,
      inicio: new Date("2027-01-15T09:30:00.000Z"),
      esSobreturno: true,
      forzar: true,
      autorizadoPor: SEED_IDS.admin,
    });

    expect(turno.esSobreturno).toBe(true);
    expect(turno.autorizadoPor).toBe(SEED_IDS.admin);
    expect(await repos.turnos.listar()).toHaveLength(1);
    expect((await repos.bloqueos.listar()).map((b) => b.id)).toEqual([bloqueo.id]);
  });

  it("rechaza un turno cuyo inicio es anterior al momento actual y no persiste", async () => {
    const crearTurno = new CrearTurno(repos);
    await expect(
      crearTurno.execute({
        pacienteId: SEED_IDS.paciente1,
        profesionalId: SEED_IDS.profesional1,
        sillonId: SEED_IDS.sillon1,
        prestacionId: SEED_IDS.consulta,
        inicio: new Date("2020-01-01T09:00:00.000Z"),
        creadoPor: SEED_IDS.recepcion,
      }),
    ).rejects.toBeInstanceOf(TurnoEnElPasadoError);

    try {
      await crearTurno.execute({
        pacienteId: SEED_IDS.paciente1,
        profesionalId: SEED_IDS.profesional1,
        sillonId: SEED_IDS.sillon1,
        prestacionId: SEED_IDS.consulta,
        inicio: new Date("2020-01-01T09:00:00.000Z"),
        creadoPor: SEED_IDS.recepcion,
      });
    } catch (e) {
      expect((e as TurnoEnElPasadoError).code).toBe("TURNO_EN_EL_PASADO");
    }
    expect(await repos.turnos.listar()).toHaveLength(0);
  });
});