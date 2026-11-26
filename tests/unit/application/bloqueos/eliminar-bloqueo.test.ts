import { beforeEach, describe, expect, it } from "vitest";

import { EliminarBloqueo } from "../../../../src/application/bloqueos/eliminar-bloqueo.js";
import type { Repositorios } from "../../../../src/application/ports/repositorios.js";
import { BloqueoNoEncontradoError } from "../../../../src/domain/bloqueo/bloqueo.errors.js";
import { InMemoryBloqueoRepository } from "../../../../src/infrastructure/persistence/in-memory-bloqueo-repository.js";
import { InMemoryPacienteRepository } from "../../../../src/infrastructure/persistence/in-memory-paciente-repository.js";
import { InMemoryPrestacionRepository } from "../../../../src/infrastructure/persistence/in-memory-prestacion-repository.js";
import { InMemoryProfesionalRepository } from "../../../../src/infrastructure/persistence/in-memory-profesional-repository.js";
import { InMemorySessionRepository } from "../../../../src/infrastructure/persistence/in-memory-session-repository.js";
import { InMemorySillonRepository } from "../../../../src/infrastructure/persistence/in-memory-sillon-repository.js";
import { InMemoryTurnoRepository } from "../../../../src/infrastructure/persistence/in-memory-turno-repository.js";
import { InMemoryUsuarioRepository } from "../../../../src/infrastructure/persistence/in-memory-usuario-repository.js";
import { SEED_IDS } from "../../../../src/infrastructure/seed.js";

const ID_BLOQUEO = "00000000-0000-4000-8000-000000000086";
const ID_INEXISTENTE = "00000000-0000-4000-8000-000000000099";

describe("EliminarBloqueo", () => {
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
    await repos.bloqueos.crear({
      id: ID_BLOQUEO,
      profesionalId: SEED_IDS.profesional1,
      inicio: new Date("2027-01-15T09:00:00.000Z"),
      fin: new Date("2027-01-15T09:30:00.000Z"),
      motivo: "Prueba",
      creadoPor: SEED_IDS.admin,
      createdAt: new Date("2026-11-17T12:00:00.000Z"),
    });
  });

  it("elimina físicamente el bloqueo y desaparece de las consultas", async () => {
    await expect(new EliminarBloqueo(repos).execute(ID_BLOQUEO)).resolves.toBeUndefined();

    expect(await repos.bloqueos.buscarPorId(ID_BLOQUEO)).toBeUndefined();
    expect(await repos.bloqueos.listar()).toEqual([]);
  });

  it("lanza BLOQUEO_NO_ENCONTRADO con el id cuando no existe", async () => {
    let error: unknown;
    try {
      await new EliminarBloqueo(repos).execute(ID_INEXISTENTE);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(BloqueoNoEncontradoError);
    const tipado = error as BloqueoNoEncontradoError;
    expect(tipado.code).toBe("BLOQUEO_NO_ENCONTRADO");
    expect(tipado.id).toBe(ID_INEXISTENTE);
  });

  it("una segunda eliminación vuelve a fallar (triangulación)", async () => {
    const eliminar = new EliminarBloqueo(repos);
    await eliminar.execute(ID_BLOQUEO);

    await expect(eliminar.execute(ID_BLOQUEO)).rejects.toBeInstanceOf(BloqueoNoEncontradoError);
    expect(await repos.bloqueos.listar()).toEqual([]);
  });
});
