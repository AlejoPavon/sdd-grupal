import { describe, expect, it } from "vitest";

import { DominioError } from "../../../src/domain/errors/dominio-error.js";
import { DominioError as DominioErrorReExportado } from "../../../src/domain/turno/turno.errors.js";
import {
  CredencialesInvalidasError,
  NoAutenticadoError,
  SinPermisoError,
} from "../../../src/domain/usuario/usuario.errors.js";

describe("errores de autenticación", () => {
  it("CredencialesInvalidasError expone código 401, mensaje único y details vacío", () => {
    const error = new CredencialesInvalidasError();

    expect(error).toBeInstanceOf(DominioError);
    expect(error.code).toBe("CREDENCIALES_INVALIDAS");
    expect(error.message).toBe("Email o contraseña incorrectos");
    expect(error.details).toEqual({});
  });

  it("NoAutenticadoError expone código NO_AUTENTICADO y details vacío", () => {
    const error = new NoAutenticadoError();

    expect(error).toBeInstanceOf(DominioError);
    expect(error.code).toBe("NO_AUTENTICADO");
    expect(error.details).toEqual({});
  });

  it("SinPermisoError expone código SIN_PERMISO y details vacío", () => {
    const error = new SinPermisoError();

    expect(error).toBeInstanceOf(DominioError);
    expect(error.code).toBe("SIN_PERMISO");
    expect(error.details).toEqual({});
  });

  it("DominioError sigue disponible desde turno.errors (compatibilidad)", () => {
    expect(DominioErrorReExportado).toBe(DominioError);
    expect(new CredencialesInvalidasError()).toBeInstanceOf(DominioErrorReExportado);
  });

  it("permite mensaje y details propios en un error de dominio", () => {
    class ErrorConDetalle extends DominioError {
      readonly code = "ERROR_CON_DETALLE";
      constructor() {
        super("Mensaje distinto", { campo: "valor" });
      }
    }

    const error = new ErrorConDetalle();
    expect(error.message).toBe("Mensaje distinto");
    expect(error.details).toEqual({ campo: "valor" });
  });
});
