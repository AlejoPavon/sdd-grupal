import type { FastifyInstance } from "fastify";

import { CrearTurno } from "../../application/crear-turno.js";
import type { Repositorios } from "../../application/ports/repositorios.js";
import { SEED_IDS } from "../../infrastructure/seed.js";
import { crearTurnoSchema } from "../schemas/turno.js";

export function registrarRutasTurnos(app: FastifyInstance, repos: Repositorios): void {
  app.post("/api/turnos", async (request, reply) => {
    const body = crearTurnoSchema.parse(request.body);

    const crearTurno = new CrearTurno(repos);
    const turno = await crearTurno.execute({
      pacienteId: body.pacienteId,
      profesionalId: body.profesionalId,
      sillonId: body.sillonId,
      prestacionId: body.prestacionId,
      inicio: new Date(body.inicio),
      creadoPor: SEED_IDS.recepcion,
    });

    return reply.status(201).send(turno);
  });
}