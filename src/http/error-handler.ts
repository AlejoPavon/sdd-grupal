import type { FastifyInstance, FastifyReply } from "fastify";
import { ZodError } from "zod";

import {
  DominioError,
  IntervaloInvalidoError,
  RecursoInactivoError,
  RecursoNoEncontradoError,
  TransicionInvalidaError,
  TurnoSolapadoError,
} from "../domain/turno/turno.errors.js";
import {
  BloqueoIntervaloInvalidoError,
  BloqueoMotivoRequeridoError,
  BloqueoNoEncontradoError,
  BloqueoRecursoRequeridoError,
  TurnoBloqueadoError,
} from "../domain/bloqueo/bloqueo.errors.js";
import { PacienteDuplicadoError } from "../domain/paciente/paciente.errors.js";
import {
  CredencialesInvalidasError,
  NoAutenticadoError,
  SinPermisoError,
} from "../domain/usuario/usuario.errors.js";

function responderDominio(reply: FastifyReply, status: number, error: DominioError) {
  return reply.status(status).send({
    code: error.code,
    message: error.message,
    details: error.details,
  });
}

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

    // Bloqueos: códigos estables propios antes del genérico de DominioError.
    if (error instanceof TurnoBloqueadoError) {
      return reply.status(409).send({
        code: error.code,
        message: error.message,
        details: {
          bloqueo: {
            id: error.bloqueo.id,
            inicio: error.bloqueo.inicio,
            fin: error.bloqueo.fin,
          },
        },
      });
    }

    if (error instanceof BloqueoNoEncontradoError) {
      return reply.status(404).send({
        code: error.code,
        message: error.message,
        details: { id: error.id },
      });
    }

    if (
      error instanceof BloqueoIntervaloInvalidoError ||
      error instanceof BloqueoRecursoRequeridoError ||
      error instanceof BloqueoMotivoRequeridoError
    ) {
      return responderDominio(reply, 400, error);
    }

    // Ramas explícitas de autenticación: el genérico de DominioError es 400.
    if (error instanceof CredencialesInvalidasError) {
      return responderDominio(reply, 401, error);
    }

    if (error instanceof NoAutenticadoError) {
      return responderDominio(reply, 401, error);
    }

    if (error instanceof SinPermisoError) {
      return responderDominio(reply, 403, error);
    }

    if (error instanceof DominioError) {
      return responderDominio(reply, 400, error);
    }

    // Fastify 5 tipa el error del handler como `unknown`.
    const generico = error as { statusCode?: number; message?: string };
    return reply.status(generico.statusCode ?? 500).send({
      code: "ERROR_INTERNO",
      message: generico.message ?? "Error interno",
      details: {},
    });
  });
}