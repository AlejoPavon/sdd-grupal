import { describe, expect, it } from "vitest";

import { TTL_SESION_DEFAULT_MS, ttlSesionMsDesdeEnv } from "../../../src/http/server.js";

describe("ttlSesionMsDesdeEnv", () => {
  it("usa 480 minutos por defecto", () => {
    expect(TTL_SESION_DEFAULT_MS).toBe(480 * 60 * 1000);
    expect(ttlSesionMsDesdeEnv({})).toBe(TTL_SESION_DEFAULT_MS);
  });

  it("convierte un valor positivo a milisegundos", () => {
    expect(ttlSesionMsDesdeEnv({ SESSION_TTL_MINUTES: "15" })).toBe(15 * 60 * 1000);
  });

  it("cae al default con valores inválidos, cero o negativos", () => {
    for (const valor of ["abc", "", "0", "-5"]) {
      expect(ttlSesionMsDesdeEnv({ SESSION_TTL_MINUTES: valor })).toBe(TTL_SESION_DEFAULT_MS);
    }
  });
});
