import type { FastifyInstance } from "fastify";

import {
  ListarPrestaciones,
  ListarProfesionales,
  ListarSillones,
} from "../../application/catalogos/listar-catalogos.js";
import type { Repositorios } from "../../application/ports/repositorios.js";

export function registrarRutasCatalogos(app: FastifyInstance, repos: Repositorios): void {
  app.get("/api/profesionales", async (_request, reply) => {
    const listar = new ListarProfesionales(repos);
    return reply.send(await listar.execute());
  });

  app.get("/api/sillones", async (_request, reply) => {
    const listar = new ListarSillones(repos);
    return reply.send(await listar.execute());
  });

  app.get("/api/prestaciones", async (_request, reply) => {
    const listar = new ListarPrestaciones(repos);
    return reply.send(await listar.execute());
  });
}