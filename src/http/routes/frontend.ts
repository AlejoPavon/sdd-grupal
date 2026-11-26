import { readFileSync } from "node:fs";
import path from "node:path";
import type { FastifyInstance } from "fastify";

interface RecursoEstatico {
  archivo: string;
  tipo: string;
}

/** Lista explícita: nunca se sirven archivos del repo por nombre arbitrario. */
const RECURSOS: Record<string, RecursoEstatico> = {
  "/": { archivo: "index.html", tipo: "text/html; charset=utf-8" },
  "/index.html": { archivo: "index.html", tipo: "text/html; charset=utf-8" },
  "/styles.css": { archivo: "styles.css", tipo: "text/css; charset=utf-8" },
  "/app.js": { archivo: "app.js", tipo: "text/javascript; charset=utf-8" },
  "/helpers.js": { archivo: "helpers.js", tipo: "text/javascript; charset=utf-8" },
};

export function registrarFrontend(
  app: FastifyInstance,
  raiz: string = path.resolve(process.cwd(), "web"),
): void {
  for (const [ruta, recurso] of Object.entries(RECURSOS)) {
    app.get(ruta, async (_request, reply) => {
      const contenido = readFileSync(path.join(raiz, recurso.archivo));
      return reply.type(recurso.tipo).send(contenido);
    });
  }
}
