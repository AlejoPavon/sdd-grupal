import cookie from "@fastify/cookie";
import type { FastifyInstance, FastifyRequest, preHandlerHookHandler } from "fastify";

import { ObtenerSesion } from "../../application/auth/obtener-sesion.js";
import type { Repositorios } from "../../application/ports/repositorios.js";
import type { Rol, UsuarioAutenticado } from "../../domain/usuario/usuario.js";
import { NoAutenticadoError, SinPermisoError } from "../../domain/usuario/usuario.errors.js";

declare module "fastify" {
  interface FastifyRequest {
    usuario?: UsuarioAutenticado;
  }
}

export const COOKIE_SESION = "session";

const RUTAS_PUBLICAS = new Set(["GET /health", "POST /api/auth/login"]);

/** Solo separa el query string; la allowlist es exacta (sin normalizar barras finales). */
function pathnameDe(url: string): string {
  const indice = url.indexOf("?");
  return indice === -1 ? url : url.slice(0, indice);
}

function esPublica(method: string, pathname: string): boolean {
  return RUTAS_PUBLICAS.has(`${method} ${pathname}`);
}

/** Registra cookie y el hook en el root: nunca dentro de un register encapsulado. */
export function registrarAuthPlugin(app: FastifyInstance, repos: Repositorios): void {
  app.register(cookie);
  app.decorateRequest("usuario", undefined);

  const obtenerSesion = new ObtenerSesion(repos.usuarios, repos.sesiones);

  app.addHook("onRequest", async (request: FastifyRequest) => {
    const pathname = pathnameDe(request.url);
    if (!pathname.startsWith("/api/") || esPublica(request.method, pathname)) return;

    const token = request.cookies[COOKIE_SESION];
    if (!token) throw new NoAutenticadoError();
    request.usuario = await obtenerSesion.execute(token);
  });
}

/** Defensa en profundidad: el hook ya adjunta el usuario en toda ruta privada. */
export function usuarioAutenticado(request: FastifyRequest): UsuarioAutenticado {
  if (!request.usuario) throw new NoAutenticadoError();
  return request.usuario;
}

/** Token de sesión de la request, o error si el hook no lo pudo resolver. */
export function tokenSesion(request: FastifyRequest): string {
  const token = request.cookies[COOKIE_SESION];
  if (!token) throw new NoAutenticadoError();
  return token;
}

export function requireRole(...roles: Rol[]): preHandlerHookHandler {
  return async (request: FastifyRequest) => {
    if (!request.usuario) throw new NoAutenticadoError();
    if (!roles.includes(request.usuario.rol)) throw new SinPermisoError();
  };
}
