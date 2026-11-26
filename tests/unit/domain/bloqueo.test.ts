import { describe, expect, it } from "vitest";

import { Intervalo } from "../../../src/domain/turno/intervalo.js";
import {
  bloqueoSeSuperponeConIntervalo,
  crearBloqueo,
  intervaloDelBloqueo,
} from "../../../src/domain/bloqueo/bloqueo.js";
import {
  BloqueoIntervaloInvalidoError,
  BloqueoMotivoRequeridoError,
  BloqueoRecursoRequeridoError,
} from "../../../src/domain/bloqueo/bloqueo.errors.js";

const DATOS_BASE = {
  id: "00000000-0000-4000-8000-000000000071",
  inicio: new Date("2027-01-15T09:00:00.000Z"),
  fin: new Date("2027-01-15T09:30:00.000Z"),
  motivo: "Cirugía programada",
  creadoPor: "00000000-0000-4000-8000-000000000051",
  createdAt: new Date("2026-11-17T12:00:00.000Z"),
};

const PROFESIONAL = "00000000-0000-4000-8000-000000000021";
const SILLON = "00000000-0000-4000-8000-000000000011";

describe("Bloqueo (dominio)", () => {
  it("crea un bloqueo de profesional con intervalo semiabierto y trazabilidad", () => {
    const bloqueo = crearBloqueo({ ...DATOS_BASE, profesionalId: PROFESIONAL });

    expect(bloqueo).toEqual({
      ...DATOS_BASE,
      profesionalId: PROFESIONAL,
    });
    expect(bloqueo.inicio.toISOString()).toBe("2027-01-15T09:00:00.000Z");
    expect(bloqueo.fin.toISOString()).toBe("2027-01-15T09:30:00.000Z");
  });

  it("crea un bloqueo de sillón sin profesional", () => {
    const bloqueo = crearBloqueo({ ...DATOS_BASE, sillonId: SILLON });

    expect(bloqueo.sillonId).toBe(SILLON);
    expect(bloqueo.profesionalId).toBeUndefined();
  });

  it("crea un bloqueo con profesional y sillón a la vez", () => {
    const bloqueo = crearBloqueo({ ...DATOS_BASE, profesionalId: PROFESIONAL, sillonId: SILLON });

    expect(bloqueo.profesionalId).toBe(PROFESIONAL);
    expect(bloqueo.sillonId).toBe(SILLON);
  });

  it("rechaza un bloqueo sin profesional ni sillón con código estable", () => {
    let error: unknown;
    try {
      crearBloqueo(DATOS_BASE);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(BloqueoRecursoRequeridoError);
    expect((error as BloqueoRecursoRequeridoError).code).toBe("BLOQUEO_RECURSO_REQUERIDO");
  });

  it.each([
    ["fin anterior", new Date("2027-01-15T08:59:00.000Z")],
    ["fin igual", new Date("2027-01-15T09:00:00.000Z")],
  ])("rechaza %s al inicio", (_titulo, fin) => {
    expect(() => crearBloqueo({ ...DATOS_BASE, profesionalId: PROFESIONAL, fin })).toThrow(
      BloqueoIntervaloInvalidoError,
    );
  });

  it.each([
    ["inicio", new Date("no-es-fecha"), DATOS_BASE.fin],
    ["fin", DATOS_BASE.inicio, new Date("no-es-fecha")],
  ])("rechaza fecha inválida en %s", (_campo, inicio, fin) => {
    let error: unknown;
    try {
      crearBloqueo({ ...DATOS_BASE, profesionalId: PROFESIONAL, inicio, fin });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(BloqueoIntervaloInvalidoError);
    expect((error as BloqueoIntervaloInvalidoError).code).toBe("BLOQUEO_INTERVALO_INVALIDO");
  });

  it("rechaza un motivo vacío o compuesto solo por espacios", () => {
    for (const motivo of ["", "   "]) {
      expect(() => crearBloqueo({ ...DATOS_BASE, profesionalId: PROFESIONAL, motivo })).toThrow(
        BloqueoMotivoRequeridoError,
      );
    }
  });

  it("acepta fechas ISO con zona y las normaliza a UTC", () => {
    const bloqueo = crearBloqueo({
      ...DATOS_BASE,
      profesionalId: PROFESIONAL,
      inicio: new Date("2027-01-15T06:00:00-03:00"),
      fin: new Date("2027-01-15T06:30:00-03:00"),
    });

    expect(bloqueo.inicio.toISOString()).toBe("2027-01-15T09:00:00.000Z");
    expect(bloqueo.fin.toISOString()).toBe("2027-01-15T09:30:00.000Z");
    expect(intervaloDelBloqueo(bloqueo).duracionMinutos()).toBe(30);
  });

  it("permite dos bloqueos solapados del mismo recurso pero detecta la superposición", () => {
    const primero = crearBloqueo({ ...DATOS_BASE, profesionalId: PROFESIONAL });
    const segundo = crearBloqueo({
      ...DATOS_BASE,
      id: "00000000-0000-4000-8000-000000000072",
      profesionalId: PROFESIONAL,
      inicio: new Date("2027-01-15T09:15:00.000Z"),
      fin: new Date("2027-01-15T09:45:00.000Z"),
    });

    expect(segundo.id).not.toBe(primero.id);
    expect(bloqueoSeSuperponeConIntervalo(primero, intervaloDelBloqueo(segundo))).toBe(true);
  });

  it("considera contiguos dos bloqueos que se tocan en un extremo", () => {
    const primero = crearBloqueo({ ...DATOS_BASE, profesionalId: PROFESIONAL });
    const contiguo = new Intervalo(
      new Date("2027-01-15T09:30:00.000Z"),
      new Date("2027-01-15T10:00:00.000Z"),
    );

    expect(bloqueoSeSuperponeConIntervalo(primero, contiguo)).toBe(false);
    expect(bloqueoSeSuperponeConIntervalo(primero, intervaloDelBloqueo(primero))).toBe(true);
  });
});
