import type { FastifyInstance } from "fastify";

import { CrearTurno } from "../../application/crear-turno.js";
import { ListarTurnos, ObtenerTurno } from "../../application/turnos/listar-turnos.js";
import type { Repositorios } from "../../application/ports/repositorios.js";
import { SEED_IDS } from "../../infrastructure/seed.js";
import { crearTurnoSchema, turnoQuerySchema } from "../schemas/turno.js";

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

  app.get("/api/turnos", async (request, reply) => {
    const query = turnoQuerySchema.parse(request.query);
    const listar = new ListarTurnos(repos);
    const turnos = await listar.execute({
      desde: query.desde ? new Date(query.desde) : undefined,
      hasta: query.hasta ? new Date(query.hasta) : undefined,
      profesionalId: query.profesionalId,
      sillonId: query.sillonId,
    });
    return reply.send(turnos);
  });

  app.get("/api/turnos/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const obtener = new ObtenerTurno(repos);
    const turno = await obtener.execute(id);
    return reply.send(turno);
  });
}