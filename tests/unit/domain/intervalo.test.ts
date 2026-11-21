import { describe, it, expect } from "vitest";
import { Intervalo } from "../../../src/domain/turno/intervalo.js";
import { IntervaloInvalidoError } from "../../../src/domain/turno/turno.errors.js";

const hora = (hhmm: string): Date => new Date(`2026-11-18T${hhmm}:00.000Z`);
const intervalo = (desde: string, hasta: string): Intervalo =>
  new Intervalo(hora(desde), hora(hasta));

describe("Intervalo.seSuperponeCon", () => {
  it("no se superpone cuando uno termina justo cuando empieza el otro", () => {
    expect(intervalo("09:00", "09:30").seSuperponeCon(intervalo("09:30", "10:00"))).toBe(false);
    expect(intervalo("09:30", "10:00").seSuperponeCon(intervalo("09:00", "09:30"))).toBe(false);
  });

  it("se superpone en forma parcial", () => {
    expect(intervalo("09:00", "10:00").seSuperponeCon(intervalo("09:30", "10:30"))).toBe(true);
  });

  it("se superpone cuando uno contiene al otro", () => {
    expect(intervalo("09:00", "11:00").seSuperponeCon(intervalo("09:30", "10:00"))).toBe(true);
    expect(intervalo("09:30", "10:00").seSuperponeCon(intervalo("09:00", "11:00"))).toBe(true);
  });

  it("se superpone cuando los intervalos son idénticos", () => {
    expect(intervalo("09:00", "09:30").seSuperponeCon(intervalo("09:00", "09:30"))).toBe(true);
  });

  it("no se superpone cuando están separados", () => {
    expect(intervalo("09:00", "09:30").seSuperponeCon(intervalo("10:00", "10:30"))).toBe(false);
  });
});

describe("Intervalo (validación)", () => {
  it("rechaza fin igual al inicio", () => {
    expect(() => intervalo("09:00", "09:00")).toThrow(IntervaloInvalidoError);
  });

  it("rechaza fin anterior al inicio", () => {
    expect(() => intervalo("10:00", "09:00")).toThrow(IntervaloInvalidoError);
  });

  it("rechaza fechas inválidas", () => {
    expect(() => new Intervalo(new Date("no-es-fecha"), hora("09:00"))).toThrow(
      IntervaloInvalidoError,
    );
  });
});

describe("Intervalo (duración)", () => {
  it("calcula la duración en minutos", () => {
    expect(intervalo("09:00", "09:45").duracionMinutos()).toBe(45);
  });

  it("crea el intervalo a partir de inicio y duración", () => {
    const resultado = Intervalo.desdeInicioDuracion(hora("09:00"), 90);
    expect(resultado.fin).toEqual(hora("10:30"));
  });
});