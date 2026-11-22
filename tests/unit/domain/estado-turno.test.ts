import { describe, it, expect } from "vitest";
import {
  ESTADOS_TURNO,
  ocupaAgenda,
  puedeTransicionarA,
  type EstadoTurno,
} from "../../../src/domain/turno/estado-turno.js";

describe("puedeTransicionarA", () => {
  const validas: [EstadoTurno, EstadoTurno][] = [
    ["pendiente", "confirmado"],
    ["pendiente", "cancelado"],
    ["confirmado", "atendido"],
    ["confirmado", "cancelado"],
    ["confirmado", "ausente"],
  ];

  it.each(validas)("permite %s -> %s", (desde, hacia) => {
    expect(puedeTransicionarA(desde, hacia)).toBe(true);
  });

  const invalidas: [EstadoTurno, EstadoTurno][] = [
    ["pendiente", "atendido"],
    ["pendiente", "ausente"],
    ["pendiente", "pendiente"],
    ["atendido", "cancelado"],
    ["cancelado", "pendiente"],
    ["cancelado", "cancelado"],
    ["ausente", "confirmado"],
  ];

  it.each(invalidas)("rechaza %s -> %s", (desde, hacia) => {
    expect(puedeTransicionarA(desde, hacia)).toBe(false);
  });

  it("los estados finales no pasan a ningún otro", () => {
    for (const final of ["atendido", "cancelado", "ausente"] as const) {
      for (const destino of ESTADOS_TURNO) {
        expect(puedeTransicionarA(final, destino)).toBe(false);
      }
    }
  });
});

describe("ocupaAgenda", () => {
  it("ocupan agenda pendiente y confirmado", () => {
    expect(ocupaAgenda("pendiente")).toBe(true);
    expect(ocupaAgenda("confirmado")).toBe(true);
  });

  it("no ocupan agenda atendido, cancelado ni ausente", () => {
    expect(ocupaAgenda("atendido")).toBe(false);
    expect(ocupaAgenda("cancelado")).toBe(false);
    expect(ocupaAgenda("ausente")).toBe(false);
  });
});