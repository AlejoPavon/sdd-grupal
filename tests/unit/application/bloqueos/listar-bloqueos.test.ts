import { beforeEach, describe, expect, it } from "vitest";

import { ListarBloqueos } from "../../../../src/application/bloqueos/listar-bloqueos.js";
import type { Repositorios } from "../../../../src/application/ports/repositorios.js";
import type { Bloqueo } from "../../../../src/domain/bloqueo/bloqueo.js";
import { RangoInvalidoError } from "../../../../src/domain/turno/turno.errors.js";
import { InMemoryBloqueoRepository } from "../../../../src/infrastructure/persistence/in-memory-bloqueo-repository.js";
import { InMemoryPacienteRepository } from "../../../../src/infrastructure/persistence/in-memory-paciente-repository.js";
import { InMemoryPrestacionRepository } from "../../../../src/infrastructure/persistence/in-memory-prestacion-repository.js";
import { InMemoryProfesionalRepository } from "../../../../src/infrastructure/persistence/in-memory-profesional-repository.js";
import { InMemorySessionRepository } from "../../../../src/infrastructure/persistence/in-memory-session-repository.js";
import { InMemorySillonRepository } from "../../../../src/infrastructure/persistence/in-memory-sillon-repository.js";
import { InMemoryTurnoRepository } from "../../../../src/infrastructure/persistence/in-memory-turno-repository.js";
import { InMemoryUsuarioRepository } from "../../../../src/infrastructure/persistence/in-memory-usuario-repository.js";
import { SEED_IDS } from "../../../../src/infrastructure/seed.js";

const PROFESIONAL_A = SEED_IDS.profesional1;
const PROFESIONAL_B = SEED_IDS.profesional2;
const SILLON_A = SEED_IDS.sillon1;
const SILLON_B = SEED_IDS.sillon2;

function bloqueo(id: string, profesionalId: string, sillonId: string, inicio: string, fin: string): Bloqueo {
  return {
    id,
    profesionalId,
    sillonId,
    inicio: new Date(inicio),
    fin: new Date(fin),
    motivo: "Prueba",
    creadoPor: SEED_IDS.admin,
    createdAt: new Date("2026-11-17T12:00:00.000Z"),
  };
}

const TARDE = bloqueo(
  "00000000-0000-4000-8000-000000000083",
  PROFESIONAL_B,
  SILLON_B,
  "2026-11-18T11:00:00.000Z",
  "2026-11-18T11:30:00.000Z",
);
const TEMPRANO = bloqueo(
  "00000000-0000-4000-8000-000000000084",
  PROFESIONAL_A,
  SILLON_A,
  "2026-11-18T09:00:00.000Z",
  "2026-11-18T09:30:00.000Z",
);
const MEDIO = bloqueo(
  "00000000-0000-4000-8000-000000000085",
  PROFESIONAL_B,
  SILLON_A,
  "2026-11-18T10:00:00.000Z",
  "2026-11-18T10:30:00.000Z",
);

describe("ListarBloqueos", () => {
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
    for (const b of [TARDE, TEMPRANO, MEDIO]) await repos.bloqueos.crear(b);
  });

  it("devuelve todos los bloqueos ordenados por inicio cuando no hay filtros", async () => {
    const bloqueos = await new ListarBloqueos(repos).execute({});

    expect(bloqueos.map((b) => b.id)).toEqual([TEMPRANO.id, MEDIO.id, TARDE.id]);
  });

  it("filtra por intersección semiabierta con el rango", async () => {
    const bloqueos = await new ListarBloqueos(repos).execute({
      desde: new Date("2026-11-18T09:30:00.000Z"),
      hasta: new Date("2026-11-18T11:00:00.000Z"),
    });

    expect(bloqueos.map((b) => b.id)).toEqual([MEDIO.id]);
  });

  it("rechaza desde >= hasta con RANGO_INVALIDO", async () => {
    let error: unknown;
    try {
      await new ListarBloqueos(repos).execute({
        desde: new Date("2026-11-18T10:00:00.000Z"),
        hasta: new Date("2026-11-18T10:00:00.000Z"),
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(RangoInvalidoError);
    expect((error as RangoInvalidoError).code).toBe("RANGO_INVALIDO");
  });

  it("admite rangos con un solo límite y filtros por recurso (triangulación)", async () => {
    const listar = new ListarBloqueos(repos);

    expect((await listar.execute({ desde: new Date("2026-11-18T10:15:00.000Z") })).map((b) => b.id)).toEqual([
      MEDIO.id,
      TARDE.id,
    ]);
    expect((await listar.execute({ hasta: new Date("2026-11-18T10:15:00.000Z") })).map((b) => b.id)).toEqual([
      TEMPRANO.id,
      MEDIO.id,
    ]);
    expect((await listar.execute({ profesionalId: PROFESIONAL_B })).map((b) => b.id)).toEqual([
      MEDIO.id,
      TARDE.id,
    ]);
    expect((await listar.execute({ sillonId: SILLON_A })).map((b) => b.id)).toEqual([TEMPRANO.id, MEDIO.id]);
  });

  it("rechaza desde posterior a hasta y fechas inválidas con RANGO_INVALIDO", async () => {
    const listar = new ListarBloqueos(repos);

    await expect(
      listar.execute({
        desde: new Date("2026-11-18T11:00:00.000Z"),
        hasta: new Date("2026-11-18T10:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(RangoInvalidoError);
    await expect(
      listar.execute({ desde: new Date("fecha-invalida"), hasta: new Date("2026-11-18T10:00:00.000Z") }),
    ).rejects.toBeInstanceOf(RangoInvalidoError);
  });
});
