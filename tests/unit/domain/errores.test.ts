import { describe, it, expect } from "vitest";
import {
  DominioError,
  RecursoNoEncontradoError,
  TurnoSolapadoError,
} from "../../../src/domain/turno/turno.errors.js";
import type { Turno } from "../../../src/domain/turno/turno.js";

const turno: Turno = {
  id: "turno-1",
  pacienteId: "p1",
  profesionalId: "pr1",
  sillonId: "s1",
  prestacionId: "ps1",
  inicio: new Date("2026-11-18T09:00:00.000Z"),
  fin: new Date("2026-11-18T09:30:00.000Z"),
  estado: "pendiente",
  esSobreturno: false,
  createdBy: "u1",
  createdAt: new Date("2026-11-18T08:00:00.000Z"),
  updatedAt: new Date("2026-11-18T08:00:00.000Z"),
};

describe("TurnoSolapadoError", () => {
  it("usa el código de profesional y expone el turno en conflicto", () => {
    const error = new TurnoSolapadoError("profesional", turno);
    expect(error.code).toBe("TURNO_SOLAPADO_PROFESIONAL");
    expect(error.turnoEnConflicto).toBe(turno);
    expect(error).toBeInstanceOf(DominioError);
  });

  it("usa el código de sillón", () => {
    expect(new TurnoSolapadoError("sillon", turno).code).toBe("TURNO_SOLAPADO_SILLON");
  });
});

describe("RecursoNoEncontradoError", () => {
  it("respeta el género del código de prestación", () => {
    expect(new RecursoNoEncontradoError("prestacion", "x").code).toBe(
      "PRESTACION_NO_ENCONTRADA",
    );
    expect(new RecursoNoEncontradoError("paciente", "x").code).toBe("PACIENTE_NO_ENCONTRADO");
  });
});