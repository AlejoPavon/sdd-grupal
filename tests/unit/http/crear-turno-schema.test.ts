import { describe, expect, it } from "vitest";

import { crearTurnoSchema, type CrearTurnoBody } from "../../../src/http/schemas/turno.js";

const IDS = {
  pacienteId: "00000000-0000-4000-8000-000000000041",
  profesionalId: "00000000-0000-4000-8000-000000000021",
  sillonId: "00000000-0000-4000-8000-000000000011",
  prestacionId: "00000000-0000-4000-8000-000000000031",
};

function bodyBase() {
  return { ...IDS, inicio: "2027-01-15T09:00:00.000Z" };
}

describe("crearTurnoSchema — flag esSobreturno", () => {
  it("acepta un body sin el flag y no lo inventa", () => {
    const parseado = crearTurnoSchema.parse(bodyBase());

    expect(parseado).not.toHaveProperty("esSobreturno");
  });

  it("acepta esSobreturno: true", () => {
    const parseado = crearTurnoSchema.parse({ ...bodyBase(), esSobreturno: true });

    expect(parseado.esSobreturno).toBe(true);
  });

  it("acepta esSobreturno: false", () => {
    const parseado = crearTurnoSchema.parse({ ...bodyBase(), esSobreturno: false });

    expect(parseado.esSobreturno).toBe(false);
  });

  it.each([
    ["null", null],
    ["string", "true"],
    ["número", 1],
  ])("rechaza un valor %s no booleano con la ruta del campo", (_descripcion, valor) => {
    const resultado = crearTurnoSchema.safeParse({ ...bodyBase(), esSobreturno: valor });

    expect(resultado.success).toBe(false);
    if (resultado.success) return;
    expect(
      resultado.error.issues.some((issue) => issue.path.join(".") === "esSobreturno"),
    ).toBe(true);
  });

  it("conserva el tipo CrearTurnoBody al agregar el flag", () => {
    const body: CrearTurnoBody = { ...bodyBase(), esSobreturno: true };

    expect(crearTurnoSchema.parse(body).esSobreturno).toBe(true);
  });
});
