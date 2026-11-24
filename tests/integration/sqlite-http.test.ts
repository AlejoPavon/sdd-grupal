import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildServer } from "../../src/http/server";
import { createRepos, seedIfNeeded } from "../../src/infrastructure/persistence/create-repos";
import { DEMO_PASSWORD, SEED_IDS } from "../../src/infrastructure/seed";

describe("HTTP con PERSISTENCE=sqlite", () => {
  let dir: string | undefined;
  const cierres: Array<() => void> = [];

  afterEach(() => {
    while (cierres.length) cierres.pop()!();
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  });

  async function levantar(url?: string) {
    if (!url) {
      dir = mkdtempSync(path.join(tmpdir(), "http-"));
      url = `file:${path.join(dir, "t.db")}`;
    }
    const repos = createRepos({ persistence: "sqlite", databaseUrl: url });
    await seedIfNeeded(repos);
    const app = buildServer(repos);
    return { app, repos, url };
  }

  async function login(app: ReturnType<typeof buildServer>) {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "admin@demo.local", password: DEMO_PASSWORD },
    });
    expect(res.statusCode).toBe(200);
    const cookies = ([] as string[]).concat((res.headers["set-cookie"] as string | string[]) ?? []);
    return cookies.map((c) => c.split(";")[0]).join("; ");
  }

  function turnoBody(over: Record<string, unknown> = {}) {
    return {
      pacienteId: SEED_IDS.paciente1,
      profesionalId: SEED_IDS.profesional1,
      sillonId: SEED_IDS.sillon1,
      prestacionId: SEED_IDS.consulta,
      inicio: "2030-01-15T12:00:00.000Z",
      ...over,
    };
  }

  it("paciente inactivo → 409 RECURSO_INACTIVO", async () => {
    const { app, repos } = await levantar();
    cierres.push(repos.cerrar);
    const cookie = await login(app);
    const baja = await app.inject({ method: "DELETE", url: `/api/pacientes/${SEED_IDS.paciente2}`, headers: { cookie } });
    expect(baja.statusCode).toBe(200);
    const res = await app.inject({
      method: "POST",
      url: "/api/turnos",
      headers: { cookie },
      payload: turnoBody({ pacienteId: SEED_IDS.paciente2 }),
    });
    await app.close();
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("RECURSO_INACTIVO");
  });

  it("solapamiento de profesional → 409 TURNO_SOLAPADO_PROFESIONAL", async () => {
    const { app, repos } = await levantar();
    cierres.push(repos.cerrar);
    const cookie = await login(app);
    const primero = await app.inject({ method: "POST", url: "/api/turnos", headers: { cookie }, payload: turnoBody() });
    expect(primero.statusCode).toBe(201);
    const res = await app.inject({
      method: "POST",
      url: "/api/turnos",
      headers: { cookie },
      payload: turnoBody({
        pacienteId: SEED_IDS.paciente2,
        sillonId: SEED_IDS.sillon2,
        inicio: "2030-01-15T12:15:00.000Z",
      }),
    });
    await app.close();
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("TURNO_SOLAPADO_PROFESIONAL");
  });

  it("un turno creado sigue disponible tras reiniciar el servidor", async () => {
    const a = await levantar();
    const cookieA = await login(a.app);
    const creado = await a.app.inject({ method: "POST", url: "/api/turnos", headers: { cookie: cookieA }, payload: turnoBody() });
    expect(creado.statusCode).toBe(201);
    const id = creado.json().id as string;
    await a.app.close();
    a.repos.cerrar();

    const b = await levantar(a.url);
    cierres.push(b.repos.cerrar);
    const cookieB = await login(b.app);
    const res = await b.app.inject({ method: "GET", url: `/api/turnos/${id}`, headers: { cookie: cookieB } });
    await b.app.close();
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(id);
  });

  it("la sesión no sobrevive al reinicio", async () => {
    const a = await levantar();
    const cookieA = await login(a.app);
    await a.app.close();
    a.repos.cerrar();

    const b = await levantar(a.url);
    cierres.push(b.repos.cerrar);
    const res = await b.app.inject({ method: "GET", url: `/api/turnos`, headers: { cookie: cookieA } });
    await b.app.close();
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe("NO_AUTENTICADO");
  });
});