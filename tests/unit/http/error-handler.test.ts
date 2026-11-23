import { afterEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";

import { registrarErrorHandler } from "../../../src/http/error-handler.js";
import { DominioError } from "../../../src/domain/errors/dominio-error.js";
import { RecursoNoEncontradoError } from "../../../src/domain/turno/turno.errors.js";
import {
  CredencialesInvalidasError,
  NoAutenticadoError,
  SinPermisoError,
} from "../../../src/domain/usuario/usuario.errors.js";

const apps: FastifyInstance[] = [];

function appQueLanza(error: Error): FastifyInstance {
  const app = Fastify();
  apps.push(app);
  registrarErrorHandler(app);
  app.get("/boom", async () => {
    throw error;
  });
  return app;
}

afterEach(async () => {
  for (const app of apps.splice(0)) await app.close();
});

describe("mapeo HTTP de errores de autenticación", () => {
  it("CredencialesInvalidasError se mapea a 401 con shape estable", async () => {
    const response = await appQueLanza(new CredencialesInvalidasError()).inject({
      method: "GET",
      url: "/boom",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      code: "CREDENCIALES_INVALIDAS",
      message: "Email o contraseña incorrectos",
      details: {},
    });
  });

  it("NoAutenticadoError se mapea a 401", async () => {
    const response = await appQueLanza(new NoAutenticadoError()).inject({
      method: "GET",
      url: "/boom",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe("NO_AUTENTICADO");
    expect(response.json().details).toEqual({});
  });

  it("SinPermisoError se mapea a 403", async () => {
    const response = await appQueLanza(new SinPermisoError()).inject({
      method: "GET",
      url: "/boom",
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("SIN_PERMISO");
    expect(response.json().details).toEqual({});
  });

  it("rama genérica de DominioError conserva mensaje y details propios con 400", async () => {
    class ErrorConDetalle extends DominioError {
      readonly code = "ERROR_CON_DETALLE";
      constructor() {
        super("Mensaje distinto", { campo: "valor" });
      }
    }

    const response = await appQueLanza(new ErrorConDetalle()).inject({
      method: "GET",
      url: "/boom",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      code: "ERROR_CON_DETALLE",
      message: "Mensaje distinto",
      details: { campo: "valor" },
    });
  });

  it("regresión: RecursoNoEncontradoError sigue mapeando a 404 con sus details", async () => {
    const response = await appQueLanza(new RecursoNoEncontradoError("turno", "t-1")).inject({
      method: "GET",
      url: "/boom",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      code: "TURNO_NO_ENCONTRADO",
      message: "No se encontró turno con id t-1",
      details: { recurso: "turno", id: "t-1" },
    });
  });
});
