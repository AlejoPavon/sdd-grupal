import { describe, expect, it } from "vitest";

import {
  esProfesional,
  filtrarPacientesVisibles,
  puedeVerPaciente,
  puedeVerTurno,
  profesionalIdRequerido,
} from "../../../src/application/auth/politicas.js";
import type { UsuarioAutenticado } from "../../../src/domain/usuario/usuario.js";
import type { Turno } from "../../../src/domain/turno/turno.js";

const profesional: UsuarioAutenticado = {
  id: "u-prof",
  email: "odonto1@demo.local",
  rol: "profesional",
  profesionalId: "prof-1",
};
const profesionalSinVinculo: UsuarioAutenticado = {
  id: "u-sin",
  email: "sin@demo.local",
  rol: "profesional",
};
const recepcionista: UsuarioAutenticado = {
  id: "u-rec",
  email: "recepcion@demo.local",
  rol: "recepcionista",
};

function turno(pacienteId: string, profesionalId: string, estado: Turno["estado"] = "pendiente") {
  return { pacienteId, profesionalId, estado };
}

describe("esProfesional", () => {
  it("solo es verdadero para el rol profesional", () => {
    expect(esProfesional(profesional)).toBe(true);
    expect(esProfesional(recepcionista)).toBe(false);
  });
});

describe("profesionalIdRequerido", () => {
  it("devuelve el vínculo del profesional", () => {
    expect(profesionalIdRequerido(profesional)).toBe("prof-1");
  });

  it("lanza SIN_PERMISO sin vínculo o con otro rol", () => {
    expect(() => profesionalIdRequerido(profesionalSinVinculo)).toThrow(
      expect.objectContaining({ code: "SIN_PERMISO" }),
    );
    expect(() => profesionalIdRequerido(recepcionista)).toThrow(
      expect.objectContaining({ code: "SIN_PERMISO" }),
    );
  });
});

describe("puedeVerTurno", () => {
  it("el profesional ve solo sus turnos", () => {
    expect(puedeVerTurno(profesional, turno("p-1", "prof-1"))).toBe(true);
    expect(puedeVerTurno(profesional, turno("p-2", "prof-2"))).toBe(false);
    expect(puedeVerTurno(profesionalSinVinculo, turno("p-1", "prof-1"))).toBe(false);
  });

  it("administración y recepción no tienen scoping", () => {
    const administrador: UsuarioAutenticado = {
      id: "u-admin",
      email: "admin@demo.local",
      rol: "administrador",
    };
    expect(puedeVerTurno(recepcionista, turno("p-2", "prof-2"))).toBe(true);
    expect(puedeVerTurno(administrador, turno("p-2", "prof-2"))).toBe(true);
    expect(() => profesionalIdRequerido(administrador)).toThrow(
      expect.objectContaining({ code: "SIN_PERMISO" }),
    );
  });
});

describe("puedeVerPaciente", () => {
  const turnos = [
    turno("p-1", "prof-1", "cancelado"),
    turno("p-2", "prof-2", "atendido"),
  ];

  it("usa la relación derivada de turnos en cualquier estado", () => {
    expect(puedeVerPaciente(profesional, "p-1", turnos)).toBe(true);
    expect(puedeVerPaciente(profesional, "p-2", turnos)).toBe(false);
    expect(puedeVerPaciente(profesionalSinVinculo, "p-1", turnos)).toBe(false);
  });

  it("recepcionista ve cualquier paciente", () => {
    expect(puedeVerPaciente(recepcionista, "p-2", turnos)).toBe(true);
  });
});

describe("filtrarPacientesVisibles", () => {
  const pacientes = [{ id: "p-1" }, { id: "p-2" }, { id: "p-3" }];
  const turnos = [
    turno("p-1", "prof-1", "pendiente"),
    turno("p-2", "prof-2", "pendiente"),
    turno("p-3", "prof-1", "atendido"),
  ];

  it("filtra por profesional, incluyendo turnos atendidos", () => {
    expect(filtrarPacientesVisibles(profesional, pacientes, turnos)).toEqual([
      { id: "p-1" },
      { id: "p-3" },
    ]);
  });

  it("no filtra a recepción y devuelve vacío sin vínculo", () => {
    expect(filtrarPacientesVisibles(recepcionista, pacientes, turnos)).toEqual(pacientes);
    expect(filtrarPacientesVisibles(profesionalSinVinculo, pacientes, turnos)).toEqual([]);
  });

  it("un paciente con turnos de dos profesionales es visible para ambos", () => {
    const turnosCompartidos = [
      turno("p-1", "prof-1", "cancelado"),
      turno("p-1", "prof-2", "atendido"),
    ];
    const otroProfesional: UsuarioAutenticado = { ...profesional, profesionalId: "prof-2" };

    expect(filtrarPacientesVisibles(profesional, pacientes, turnosCompartidos)).toEqual([
      { id: "p-1" },
    ]);
    expect(filtrarPacientesVisibles(otroProfesional, pacientes, turnosCompartidos)).toEqual([
      { id: "p-1" },
    ]);
  });
});
