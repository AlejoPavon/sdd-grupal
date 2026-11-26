import { beforeEach, describe, expect, it } from "vitest";

import { CancelarTurno } from "../../../src/application/cancelar-turno.js";
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
import { TransicionInvalidaError, RecursoNoEncontradoError } from "../../../src/domain/turno/turno.errors.js";

describe("CancelarTurno", () => {
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

  async function crearTurno(inicio = "2027-01-15T09:00:00.000Z") {
    const crear = new CrearTurno(repos);
    return crear.execute({
      pacienteId: SEED_IDS.paciente1,
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      prestacionId: SEED_IDS.consulta,
      inicio: new Date(inicio),
      creadoPor: SEED_IDS.recepcion,
    });
  }

  it("cancela un turno pendiente y registra cancelledAt/updatedAt", async () => {
    const turno = await crearTurno();
    const cancelar = new CancelarTurno(repos);

    const resultado = await cancelar.execute(turno.id);

    expect(resultado.estado).toBe("cancelado");
    expect(resultado.cancelledAt).toBeInstanceOf(Date);
    expect(resultado.updatedAt).toBeInstanceOf(Date);
    expect(resultado.cancelledAt!.getTime()).toBe(resultado.updatedAt.getTime());

    const persistido = await repos.turnos.buscarPorId(turno.id);
    expect(persistido!.estado).toBe("cancelado");
    expect(persistido!.cancelledAt).toEqual(resultado.cancelledAt);
  });

  it("cancela un turno confirmado", async () => {
    const turno = await crearTurno();
    await repos.turnos.actualizar({ ...turno, estado: "confirmado" });

    const cancelar = new CancelarTurno(repos);
    const resultado = await cancelar.execute(turno.id);

    expect(resultado.estado).toBe("cancelado");
  });

  it("es idempotente: segunda cancelación no modifica cancelledAt/updatedAt", async () => {
    const turno = await crearTurno();
    const cancelar = new CancelarTurno(repos);

    const primera = await cancelar.execute(turno.id);
    const segunda = await cancelar.execute(turno.id);

    expect(segunda.estado).toBe("cancelado");
    expect(segunda.cancelledAt!.getTime()).toBe(primera.cancelledAt!.getTime());
    expect(segunda.updatedAt.getTime()).toBe(primera.updatedAt.getTime());
  });

  it("lanza TRANSICION_INVALIDA para turno atendido", async () => {
    const turno = await crearTurno();
    await repos.turnos.actualizar({ ...turno, estado: "atendido" });

    const cancelar = new CancelarTurno(repos);
    await expect(cancelar.execute(turno.id)).rejects.toBeInstanceOf(TransicionInvalidaError);
    try {
      await cancelar.execute(turno.id);
    } catch (e) {
      expect((e as TransicionInvalidaError).code).toBe("TRANSICION_INVALIDA");
    }

    const persistido = await repos.turnos.buscarPorId(turno.id);
    expect(persistido!.estado).toBe("atendido");
  });

  it("lanza TRANSICION_INVALIDA para turno ausente", async () => {
    const turno = await crearTurno();
    await repos.turnos.actualizar({ ...turno, estado: "ausente" });

    const cancelar = new CancelarTurno(repos);
    await expect(cancelar.execute(turno.id)).rejects.toBeInstanceOf(TransicionInvalidaError);
  });

  it("lanza TURNO_NO_ENCONTRADO para id inexistente", async () => {
    const cancelar = new CancelarTurno(repos);
    await expect(cancelar.execute("no-existe")).rejects.toBeInstanceOf(RecursoNoEncontradoError);
    try {
      await cancelar.execute("no-existe");
    } catch (e) {
      expect((e as RecursoNoEncontradoError).code).toBe("TURNO_NO_ENCONTRADO");
    }
  });

  it("acepta execute({ id })", async () => {
    const turno = await crearTurno();
    const cancelar = new CancelarTurno(repos.turnos);
    const resultado = await cancelar.execute({ id: turno.id });
    expect(resultado.estado).toBe("cancelado");
  });
});