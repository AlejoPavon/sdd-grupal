import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import {
  DominioError,
  IntervaloInvalidoError,
  RecursoInactivoError,
  RecursoNoEncontradoError,
  TransicionInvalidaError,
  TurnoSolapadoError,
} from "../domain/turno/turno.errors.js";
import { PacienteDuplicadoError } from "../domain/paciente/paciente.errors.js";

export function registrarErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      const details: Record<string, string> = {};
      for (const issue of error.issues) {
        const path = issue.path.join(".") || "_root";
        details[path] = issue.message;
      }
      return reply.status(400).send({
        code: "VALIDACION_FALLIDA",
        message: "Datos de entrada inválidos",
        details,
      });
    }

    if (error instanceof RecursoNoEncontradoError) {
      return reply.status(404).send({
        code: error.code,
        message: error.message,
        details: { recurso: error.recurso, id: error.id },
      });
    }

    if (error instanceof RecursoInactivoError) {
      return reply.status(409).send({
        code: error.code,
        message: error.message,
        details: { recurso: error.recurso, id: error.id },
      });
    }

    if (error instanceof IntervaloInvalidoError) {
      return reply.status(400).send({
        code: error.code,
        message: error.message,
        details: {},
      });
    }

    if (error instanceof TransicionInvalidaError) {
      return reply.status(409).send({
        code: error.code,
        message: error.message,
        details: {},
      });
    }

    if (error instanceof TurnoSolapadoError) {
      return reply.status(409).send({
        code: error.code,
        message: error.message,
        details: {
          turnoEnConflicto: {
            id: error.turnoEnConflicto.id,
            inicio: error.turnoEnConflicto.inicio,
            fin: error.turnoEnConflicto.fin,
          },
        },
      });
    }

    if (error instanceof PacienteDuplicadoError) {
      return reply.status(409).send({
        code: error.code,
        message: error.message,
        details: { campo: error.campo },
      });
    }

    if (error instanceof DominioError) {
      return reply.status(400).send({
        code: error.code,
        message: error.message,
        details: {},
      });
    }

    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    return reply.status(statusCode).send({
      code: "ERROR_INTERNO",
      message: error.message,
      details: {},
    });
  });
}