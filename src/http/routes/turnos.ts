import type { FastifyInstance } from "fastify";

import { CancelarTurno } from "../../application/cancelar-turno.js";
import { CrearTurno } from "../../application/crear-turno.js";
import { esProfesional, puedeVerTurno, profesionalIdRequerido } from "../../application/auth/politicas.js";
import { ListarTurnos, ObtenerTurno } from "../../application/turnos/listar-turnos.js";
import type { Repositorios } from "../../application/ports/repositorios.js";
import { SinPermisoError } from "../../domain/usuario/usuario.errors.js";
import { requireRole, usuarioAutenticado } from "../plugins/auth.js";
import { crearTurnoSchema, turnoQuerySchema } from "../schemas/turno.js";

const SOLO_GESTION = requireRole("administrador", "recepcionista");

export function registrarRutasTurnos(app: FastifyInstance, repos: Repositorios): void {
  app.post("/api/turnos", { preHandler: SOLO_GESTION }, async (request, reply) => {
    const body = crearTurnoSchema.parse(request.body);
    const usuario = usuarioAutenticado(request);

    // `forzar` es una excepción exclusiva de administrador, aun sin bloqueo.
    if (body.forzar === true && usuario.rol !== "administrador") throw new SinPermisoError();

    const crearTurno = new CrearTurno(repos);
    const turno = await crearTurno.execute({
      pacienteId: body.pacienteId,
      profesionalId: body.profesionalId,
      sillonId: body.sillonId,
      prestacionId: body.prestacionId,
      inicio: new Date(body.inicio),
      creadoPor: usuario.id,
      forzar: body.forzar,
      autorizadoPor: usuario.id,
      esSobreturno: body.esSobreturno,
    });

    return reply.status(201).send(turno);
  });

  app.get("/api/turnos", async (request, reply) => {
    const query = turnoQuerySchema.parse(request.query);
    const usuario = usuarioAutenticado(request);

    if (esProfesional(usuario)) {
      const vinculo = profesionalIdRequerido(usuario);
      if (query.profesionalId && query.profesionalId !== vinculo) throw new SinPermisoError();
      query.profesionalId = vinculo;
    }

    const listar = new ListarTurnos(repos);
    const turnos = await listar.execute({
      desde: query.desde ? new Date(query.desde) : undefined,
      hasta: query.hasta ? new Date(query.hasta) : undefined,
      profesionalId: query.profesionalId,
      sillonId: query.sillonId,
      pacienteId: query.pacienteId,
    });
    return reply.send(turnos);
  });

  app.get("/api/turnos/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const obtener = new ObtenerTurno(repos);
    const turno = await obtener.execute(id);
    if (!puedeVerTurno(usuarioAutenticado(request), turno)) throw new SinPermisoError();
    return reply.send(turno);
  });

  app.patch("/api/turnos/:id/cancelar", { preHandler: SOLO_GESTION }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const cancelar = new CancelarTurno(repos);
    const turno = await cancelar.execute(id);
    return reply.send(turno);
  });
}
