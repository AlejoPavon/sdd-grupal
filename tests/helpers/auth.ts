import type { FastifyInstance } from "fastify";

import type { UsuarioPublico } from "../../src/application/auth/usuario-publico.js";

export type RolDemo = "administrador" | "recepcionista" | "profesional";

const EMAIL_POR_ROL: Record<RolDemo, string> = {
  administrador: "admin@demo.local",
  recepcionista: "recepcion@demo.local",
  profesional: "odonto1@demo.local",
};

export interface SesionDeTest {
  cookie: string;
  headers: { cookie: string };
  usuario: UsuarioPublico;
}

/** Extrae el par `session=...` de la cabecera Set-Cookie de un login real. */
export function cookieDeRespuesta(response: {
  headers: Record<string, unknown>;
}): string {
  const cabecera = response.headers["set-cookie"];
  const valor = Array.isArray(cabecera) ? cabecera[0] : cabecera;
  if (typeof valor !== "string") throw new Error("la respuesta no incluye cookie session");
  const par = valor.split(";")[0];
  if (!par) throw new Error("cookie vacía");
  return par;
}

/** Hace login real contra la API: nunca desactiva el hook ni inyecta requests. */
export async function autenticarseComo(
  app: FastifyInstance,
  rol: RolDemo,
  password = process.env.DEMO_PASSWORD ?? "demo1234",
): Promise<SesionDeTest> {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: EMAIL_POR_ROL[rol], password },
  });

  if (response.statusCode !== 200) {
    throw new Error(`login de ${rol} falló: ${response.statusCode} ${response.body}`);
  }

  const cookie = cookieDeRespuesta(response);
  return { cookie, headers: { cookie }, usuario: response.json() as UsuarioPublico };
}
