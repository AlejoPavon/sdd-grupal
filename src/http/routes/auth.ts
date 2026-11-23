import type { FastifyInstance } from "fastify";

import { Login } from "../../application/auth/login.js";
import { Logout } from "../../application/auth/logout.js";
import { ObtenerSesion } from "../../application/auth/obtener-sesion.js";
import type { Repositorios } from "../../application/ports/repositorios.js";
import { COOKIE_SESION, tokenSesion } from "../plugins/auth.js";
import { loginSchema } from "../schemas/auth.schema.js";

export interface OpcionesRutasAuth {
  sessionTtlMs: number;
}

export function registrarRutasAuth(
  app: FastifyInstance,
  repos: Repositorios,
  opciones: OpcionesRutasAuth,
): void {
  const login = new Login(repos.usuarios, repos.sesiones, opciones.sessionTtlMs);
  const logout = new Logout(repos.sesiones);
  const obtenerSesion = new ObtenerSesion(repos.usuarios, repos.sesiones);

  app.post("/api/auth/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const resultado = await login.execute(body);

    reply.setCookie(COOKIE_SESION, resultado.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: Math.floor(opciones.sessionTtlMs / 1000),
    });
    return reply.status(200).send(resultado.usuario);
  });

  app.post("/api/auth/logout", async (request, reply) => {
    const token = request.cookies[COOKIE_SESION];
    if (token) await logout.execute(token);
    return reply.clearCookie(COOKIE_SESION, { path: "/" }).status(204).send();
  });

  app.get("/api/auth/me", async (request, reply) => {
    const usuario = await obtenerSesion.executePublico(tokenSesion(request));
    return reply.send(usuario);
  });
}
