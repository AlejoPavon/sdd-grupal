import type { FastifyInstance } from "fastify";

import { CrearBloqueo } from "../../application/bloqueos/crear-bloqueo.js";
import { EliminarBloqueo } from "../../application/bloqueos/eliminar-bloqueo.js";
import { ListarBloqueos } from "../../application/bloqueos/listar-bloqueos.js";
import type { Repositorios } from "../../application/ports/repositorios.js";
import { requireRole, usuarioAutenticado } from "../plugins/auth.js";
import {
  crearBloqueoSchema,
  idBloqueoParamsSchema,
  listarBloqueosQuerySchema,
} from "../schemas/bloqueo.schema.js";

const GESTION_AGENDA = requireRole("administrador", "recepcionista");
const SOLO_ADMINISTRADOR = requireRole("administrador");

export function registrarRutasBloqueos(app: FastifyInstance, repos: Repositorios): void {
  app.post("/api/bloqueos", { preHandler: GESTION_AGENDA }, async (request, reply) => {
    const body = crearBloqueoSchema.parse(request.body);
    const bloqueo = await new CrearBloqueo(repos).execute({
      profesionalId: body.profesionalId,
      sillonId: body.sillonId,
      inicio: new Date(body.inicio),
      fin: new Date(body.fin),
      motivo: body.motivo,
      creadoPor: usuarioAutenticado(request).id,
    });
    return reply.status(201).send(bloqueo);
  });

  app.get("/api/bloqueos", { preHandler: GESTION_AGENDA }, async (request, reply) => {
    const query = listarBloqueosQuerySchema.parse(request.query);
    const bloqueos = await new ListarBloqueos(repos).execute({
      desde: query.desde ? new Date(query.desde) : undefined,
      hasta: query.hasta ? new Date(query.hasta) : undefined,
    });
    return reply.send(bloqueos);
  });

  app.delete("/api/bloqueos/:id", { preHandler: SOLO_ADMINISTRADOR }, async (request, reply) => {
    const { id } = idBloqueoParamsSchema.parse(request.params);
    await new EliminarBloqueo(repos).execute(id);
    return reply.status(204).send();
  });
}
