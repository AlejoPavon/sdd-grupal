import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { Intervalo } from "../../../src/domain/turno/intervalo.js";
import type { Turno } from "../../../src/domain/turno/turno.js";
import { RecursoNoEncontradoError } from "../../../src/domain/turno/turno.errors.js";
import { InMemoryTurnoRepository } from "../../../src/infrastructure/persistence/in-memory-turno-repository.js";

const hora = (hhmm: string): Date => new Date(`2026-11-18T${hhmm}:00.000Z`);
const intervalo = (desde: string, hasta: string): Intervalo =>
  new Intervalo(hora(desde), hora(hasta));

function crearTurno(sobrescribir: Partial<Turno> = {}): Turno {
  return {
    id: randomUUID(),
    pacienteId: "paciente-1",
    profesionalId: "prof-1",
    sillonId: "sillon-1",
    prestacionId: "prest-1",
    inicio: hora("09:00"),
    fin: hora("09:30"),
    estado: "pendiente",
    esSobreturno: false,
    createdBy: "usuario-1",
    createdAt: hora("08:00"),
    updatedAt: hora("08:00"),
    ...sobrescribir,
  };
}

describe("InMemoryTurnoRepository", () => {
  let repo: InMemoryTurnoRepository;

  beforeEach(() => {
    repo = new InMemoryTurnoRepository();
  });

  describe("crear y buscarPorId", () => {
    it("guarda un turno y lo recupera por id", async () => {
      const turno = crearTurno();
      await repo.crear(turno);
      expect(await repo.buscarPorId(turno.id)).toEqual(turno);
    });

    it("devuelve undefined si el turno no existe", async () => {
      expect(await repo.buscarPorId("no-existe")).toBeUndefined();
    });

    it("no comparte referencia con el objeto guardado", async () => {
      const turno = crearTurno();
      await repo.crear(turno);
      turno.estado = "cancelado";
      expect((await repo.buscarPorId(turno.id))?.estado).toBe("pendiente");
    });
  });

  describe("solapamiento por profesional", () => {
    it("detecta un turno que se superpone en forma parcial", async () => {
      const existente = crearTurno({ inicio: hora("09:00"), fin: hora("10:00") });
      await repo.crear(existente);

      const conflictos = await repo.buscarSolapadoPorProfesional(
        "prof-1",
        intervalo("09:30", "10:30"),
      );

      expect(conflictos.map((t) => t.id)).toEqual([existente.id]);
    });

    it("no detecta conflicto con un turno contiguo", async () => {
      await repo.crear(crearTurno({ inicio: hora("09:00"), fin: hora("09:30") }));

      const conflictos = await repo.buscarSolapadoPorProfesional(
        "prof-1",
        intervalo("09:30", "10:00"),
      );

      expect(conflictos).toEqual([]);
    });

    it("no detecta conflicto con otro profesional", async () => {
      await repo.crear(crearTurno({ profesionalId: "prof-2" }));

      const conflictos = await repo.buscarSolapadoPorProfesional(
        "prof-1",
        intervalo("09:00", "09:30"),
      );

      expect(conflictos).toEqual([]);
    });

    it("ignora los turnos que no ocupan agenda", async () => {
      for (const estado of ["cancelado", "ausente", "atendido"] as const) {
        await repo.crear(crearTurno({ estado }));
      }

      const conflictos = await repo.buscarSolapadoPorProfesional(
        "prof-1",
        intervalo("09:00", "09:30"),
      );

      expect(conflictos).toEqual([]);
    });

    it("puede excluir un turno por id", async () => {
      const turno = crearTurno();
      await repo.crear(turno);

      const conflictos = await repo.buscarSolapadoPorProfesional(
        "prof-1",
        intervalo("09:00", "09:30"),
        turno.id,
      );

      expect(conflictos).toEqual([]);
    });
  });

  describe("solapamiento por sillón", () => {
    it("detecta un turno del mismo sillón aunque sea otro profesional", async () => {
      const existente = crearTurno({ profesionalId: "prof-2" });
      await repo.crear(existente);

      const conflictos = await repo.buscarSolapadoPorSillon(
        "sillon-1",
        intervalo("09:00", "09:30"),
      );

      expect(conflictos.map((t) => t.id)).toEqual([existente.id]);
    });

    it("no detecta conflicto con otro sillón", async () => {
      await repo.crear(crearTurno({ sillonId: "sillon-2" }));

      const conflictos = await repo.buscarSolapadoPorSillon(
        "sillon-1",
        intervalo("09:00", "09:30"),
      );

      expect(conflictos).toEqual([]);
    });
  });

  describe("listar", () => {
    it("filtra por rango y ordena por inicio", async () => {
      const tarde = crearTurno({ inicio: hora("11:00"), fin: hora("11:30") });
      const temprano = crearTurno({ inicio: hora("09:00"), fin: hora("09:30") });
      const fuera = crearTurno({ inicio: hora("15:00"), fin: hora("15:30") });
      await repo.crear(tarde);
      await repo.crear(temprano);
      await repo.crear(fuera);

      const resultado = await repo.listar({ desde: hora("08:00"), hasta: hora("12:00") });

      expect(resultado.map((t) => t.id)).toEqual([temprano.id, tarde.id]);
    });

    it("filtra por estados", async () => {
      const pendiente = crearTurno();
      const cancelado = crearTurno({ estado: "cancelado" });
      await repo.crear(pendiente);
      await repo.crear(cancelado);

      const resultado = await repo.listar({ estados: ["pendiente", "confirmado"] });

      expect(resultado.map((t) => t.id)).toEqual([pendiente.id]);
    });
  });

  describe("actualizar", () => {
    it("persiste el cambio", async () => {
      const turno = crearTurno();
      await repo.crear(turno);

      await repo.actualizar({ ...turno, estado: "confirmado" });

      expect((await repo.buscarPorId(turno.id))?.estado).toBe("confirmado");
    });

    it("lanza RecursoNoEncontradoError si el turno no existe", async () => {
      await expect(repo.actualizar(crearTurno())).rejects.toBeInstanceOf(
        RecursoNoEncontradoError,
      );
    });
  });
});