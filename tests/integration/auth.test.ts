import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildServer } from "../../src/http/server.js";
import type { Repositorios } from "../../src/application/ports/repositorios.js";
import { InMemoryPacienteRepository } from "../../src/infrastructure/persistence/in-memory-paciente-repository.js";
import { InMemoryPrestacionRepository } from "../../src/infrastructure/persistence/in-memory-prestacion-repository.js";
import { InMemoryProfesionalRepository } from "../../src/infrastructure/persistence/in-memory-profesional-repository.js";
import { InMemorySillonRepository } from "../../src/infrastructure/persistence/in-memory-sillon-repository.js";
import { InMemoryTurnoRepository } from "../../src/infrastructure/persistence/in-memory-turno-repository.js";
import { InMemoryUsuarioRepository } from "../../src/infrastructure/persistence/in-memory-usuario-repository.js";
import { InMemoryBloqueoRepository } from "../../src/infrastructure/persistence/in-memory-bloqueo-repository.js";
import { InMemorySessionRepository } from "../../src/infrastructure/persistence/in-memory-session-repository.js";
import { cargarSeed, SEED_IDS } from "../../src/infrastructure/seed.js";

const apps: FastifyInstance[] = [];
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "demo1234";

function esperarFormatoError(response: { statusCode: number; json(): unknown }, status: number) {
  expect(response.statusCode).toBe(status);
  expect(response.json()).toEqual({
    code: expect.any(String),
    message: expect.any(String),
    details: expect.any(Object),
  });
}

async function armarServidor(opciones?: { sessionTtlMs?: number }) {
  const repos: Repositorios = {
    pacientes: new InMemoryPacienteRepository(),
    profesionales: new InMemoryProfesionalRepository(),
    sillones: new InMemorySillonRepository(),
    prestaciones: new InMemoryPrestacionRepository(),
    turnos: new InMemoryTurnoRepository(),
    usuarios: new InMemoryUsuarioRepository(),
    sesiones: new InMemorySessionRepository(),
      bloqueos: new InMemoryBloqueoRepository(),
  };
  await cargarSeed(repos);
  const app = buildServer(repos, opciones);
  apps.push(app);
  return { app, repos };
}

async function login(app: FastifyInstance, email: string, password = DEMO_PASSWORD) {
  return app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email, password },
  });
}

function cookieDe(response: { headers: Record<string, unknown> }): string {
  const cabecera = response.headers["set-cookie"];
  const valor = Array.isArray(cabecera) ? cabecera[0] : cabecera;
  if (typeof valor !== "string") throw new Error("la respuesta no incluye cookie session");
  const par = valor.split(";")[0];
  if (!par) throw new Error("cookie vacía");
  return par;
}

afterEach(async () => {
  for (const app of apps.splice(0)) await app.close();
});

describe("POST /api/auth/login", () => {
  it("hace login de los tres roles demo y devuelve solo el DTO público", async () => {
    const { app } = await armarServidor();
    const casos = [
      { email: "admin@demo.local", rol: "administrador", id: SEED_IDS.admin },
      { email: "recepcion@demo.local", rol: "recepcionista", id: SEED_IDS.recepcion },
      { email: "odonto1@demo.local", rol: "profesional", id: SEED_IDS.odonto1 },
    ];

    for (const caso of casos) {
      const response = await login(app, caso.email);

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        id: caso.id,
        email: caso.email,
        nombre: expect.any(String),
        apellido: "Demo",
        rol: caso.rol,
      });
      expect(JSON.stringify(response.json())).not.toContain("passwordHash");
      expect(JSON.stringify(response.json())).not.toContain("token");
      expect(cookieDe(response)).toMatch(/^session=/);
    }
  });

  it("rechaza password incorrecto con 401 y mensaje uniforme", async () => {
    const { app } = await armarServidor();

    const response = await login(app, "admin@demo.local", "incorrecta");

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      code: "CREDENCIALES_INVALIDAS",
      message: "Email o contraseña incorrectos",
      details: {},
    });
    expect(response.headers["set-cookie"]).toBeUndefined();
  });

  it("rechaza email inexistente con el mismo code y message", async () => {
    const { app } = await armarServidor();

    const response = await login(app, "no-existe@demo.local");

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      code: "CREDENCIALES_INVALIDAS",
      message: "Email o contraseña incorrectos",
      details: {},
    });
  });

  it("rechaza un usuario inactivo con el mismo mensaje", async () => {
    const { app, repos } = await armarServidor();
    const usuario = await repos.usuarios.buscarPorId(SEED_IDS.admin);
    if (!usuario) throw new Error("usuario de seed no encontrado");
    await repos.usuarios.crear({ ...usuario, activo: false });

    const response = await login(app, "admin@demo.local");

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe("CREDENCIALES_INVALIDAS");
    expect(response.json().message).toBe("Email o contraseña incorrectos");
  });

  it("rechaza un cuerpo sin token de sesión con 400 y shape estable", async () => {
    const { app } = await armarServidor();

    const sinEmail = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { password: "demo1234" },
    });

    esperarFormatoError(sinEmail, 400);
    expect(sinEmail.json().code).toBe("VALIDACION_FALLIDA");
  });

  it("usa SESSION_TTL_MINUTES positivo y cae al default si es inválido", async () => {
    const anterior = process.env.SESSION_TTL_MINUTES;
    try {
      process.env.SESSION_TTL_MINUTES = "15";
      const { app: appConfigurado } = await armarServidor();
      const configurado = await login(appConfigurado, "admin@demo.local");
      expect(String(configurado.headers["set-cookie"])).toMatch(/Max-Age=900/);

      process.env.SESSION_TTL_MINUTES = "no-numero";
      const { app: appInvalido } = await armarServidor();
      const invalido = await login(appInvalido, "admin@demo.local");
      expect(String(invalido.headers["set-cookie"])).toMatch(/Max-Age=28800/);

      process.env.SESSION_TTL_MINUTES = "0";
      const { app: appCero } = await armarServidor();
      const cero = await login(appCero, "admin@demo.local");
      expect(String(cero.headers["set-cookie"])).toMatch(/Max-Age=28800/);
    } finally {
      if (anterior === undefined) delete process.env.SESSION_TTL_MINUTES;
      else process.env.SESSION_TTL_MINUTES = anterior;
    }
  });

  it("emite la cookie httpOnly, sameSite lax y path / en desarrollo", async () => {
    const { app } = await armarServidor();

    const response = await login(app, "admin@demo.local");
    const cabecera = String(response.headers["set-cookie"]);

    expect(cabecera).toMatch(/HttpOnly/i);
    expect(cabecera).toMatch(/SameSite=Lax/i);
    expect(cabecera).toMatch(/Path=\//i);
    expect(cabecera).not.toMatch(/Secure/i);
    expect(cabecera).toMatch(/Max-Age=28800/);
  });

  it("marca la cookie como secure en producción", async () => {
    const entornoAnterior = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const { app } = await armarServidor();
      const response = await login(app, "admin@demo.local");

      expect(String(response.headers["set-cookie"])).toMatch(/Secure/i);
    } finally {
      process.env.NODE_ENV = entornoAnterior;
    }
  });

  it("rechaza un body inválido con 400 VALIDACION_FALLIDA", async () => {
    const { app } = await armarServidor();

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "no-es-email", password: "" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe("VALIDACION_FALLIDA");
  });
});

describe("tokens de sesión", () => {
  it("dos logins del mismo usuario emiten tokens distintos y ambos vigentes", async () => {
    const { app } = await armarServidor();

    const primero = await login(app, "admin@demo.local");
    const segundo = await login(app, "admin@demo.local");
    const cookie1 = cookieDe(primero);
    const cookie2 = cookieDe(segundo);

    expect(cookie1).not.toBe(cookie2);
    for (const cookie of [cookie1, cookie2]) {
      const response = await app.inject({
        method: "GET",
        url: "/api/auth/me",
        headers: { cookie },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json().email).toBe("admin@demo.local");
      expect(JSON.stringify(response.json())).not.toContain("token");
    }
  });
});

describe("GET /api/auth/me", () => {
  it("devuelve el usuario de la sesión", async () => {
    const { app } = await armarServidor();
    const sesion = await login(app, "recepcion@demo.local");
    const response = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { cookie: cookieDe(sesion) },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: SEED_IDS.recepcion,
      email: "recepcion@demo.local",
      nombre: "Recepción",
      apellido: "Demo",
      rol: "recepcionista",
    });
  });

  it("rechaza una sesión vencida con NO_AUTENTICADO y shape estable", async () => {
    const { app, repos } = await armarServidor();
    const usuario = await repos.usuarios.buscarPorId(SEED_IDS.admin);
    if (!usuario) throw new Error("usuario de seed no encontrado");
    const sesion = await repos.sesiones.crear(usuario.id, -1);

    const response = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { cookie: `session=${sesion.token}` },
    });

    esperarFormatoError(response, 401);
    expect(response.json().code).toBe("NO_AUTENTICADO");
  });

  it("responde 401 sin cookie y con un token desconocido", async () => {
    const { app } = await armarServidor();

    const sinCookie = await app.inject({ method: "GET", url: "/api/auth/me" });
    const tokenInvalido = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { cookie: "session=token-inexistente" },
    });

    for (const response of [sinCookie, tokenInvalido]) {
      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        code: "NO_AUTENTICADO",
        message: expect.any(String),
        details: {},
      });
    }
  });
});

describe("POST /api/auth/logout", () => {
  it("sin cookie responde 401 porque no está en la allowlist", async () => {
    const { app } = await armarServidor();

    const response = await app.inject({ method: "POST", url: "/api/auth/logout" });

    esperarFormatoError(response, 401);
    expect(response.json().code).toBe("NO_AUTENTICADO");
  });

  it("responde 204, limpia la cookie e invalida el token", async () => {
    const { app } = await armarServidor();
    const sesion = await login(app, "admin@demo.local");
    const cookie = cookieDe(sesion);

    const logout = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
      headers: { cookie },
    });

    expect(logout.statusCode).toBe(204);
    expect(logout.body).toBe("");
    expect(String(logout.headers["set-cookie"])).toMatch(/session=/);

    const posterior = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { cookie },
    });
    expect(posterior.statusCode).toBe(401);
    expect(posterior.json().code).toBe("NO_AUTENTICADO");
  });
});

describe("protección global", () => {
  it("/health y POST /api/auth/login son públicos", async () => {
    const { app } = await armarServidor();

    const health = await app.inject({ method: "GET", url: "/health" });
    const loginResponse = await login(app, "admin@demo.local");
    const privada = await app.inject({ method: "GET", url: "/api/turnos" });

    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({ status: "ok" });
    expect(loginResponse.statusCode).toBe(200);
    expect(privada.statusCode).toBe(401);
    expect(privada.json().code).toBe("NO_AUTENTICADO");
  });

  it("la allowlist ignora query strings pero no barras finales ni otros métodos", async () => {
    const { app } = await armarServidor();
    const sesion = await login(app, "admin@demo.local");

    const healthConQuery = await app.inject({ method: "GET", url: "/health?detalle=1" });
    const turnosConQuery = await app.inject({
      method: "GET",
      url: `/api/turnos?profesionalId=${SEED_IDS.profesional1}`,
      headers: { cookie: cookieDe(sesion) },
    });
    const loginConBarraFinal = await app.inject({
      method: "POST",
      url: "/api/auth/login/",
      payload: { email: "admin@demo.local", password: DEMO_PASSWORD },
    });
    const loginConMetodoIncorrecto = await app.inject({
      method: "GET",
      url: "/api/auth/login",
    });

    expect(healthConQuery.statusCode).toBe(200);
    expect(turnosConQuery.statusCode).toBe(200);
    // La barra final no coincide con la allowlist exacta: el hook default-deny responde 401.
    esperarFormatoError(loginConBarraFinal, 401);
    esperarFormatoError(loginConMetodoIncorrecto, 401);
  });

  it("una ruta fuera de /api no requiere sesión", async () => {
    const { app } = await armarServidor();

    const response = await app.inject({ method: "GET", url: "/no-existe" });

    expect(response.statusCode).toBe(404);
  });

  it("una ruta privada con sesión válida continúa hacia el handler", async () => {
    const { app } = await armarServidor();
    const sesion = await login(app, "admin@demo.local");

    const response = await app.inject({
      method: "GET",
      url: "/api/turnos",
      headers: { cookie: cookieDe(sesion) },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });
});
