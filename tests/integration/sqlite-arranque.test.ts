import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildServer } from "../../src/http/server";
import { createRepos, seedIfNeeded } from "../../src/infrastructure/persistence/create-repos";
import { InMemoryTurnoRepository } from "../../src/infrastructure/persistence/in-memory-turno-repository";
import { SqliteTurnoRepository } from "../../src/infrastructure/persistence/sqlite/sqlite-turno-repository";
import { DEMO_PASSWORD } from "../../src/infrastructure/seed";

describe("arranque y seed", () => {
  let dir: string | undefined;
  const cierres: Array<() => void> = [];

  afterEach(() => {
    while (cierres.length) cierres.pop()!();
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  });

  function urlTemporal() {
    dir = mkdtempSync(path.join(tmpdir(), "arranque-"));
    return { file: path.join(dir, "t.db"), url: `file:${path.join(dir, "t.db")}` };
  }

  it("sin PERSISTENCE usa repositorios en memoria", () => {
    const repos = createRepos({ persistence: "memory" });
    expect(repos.turnos).toBeInstanceOf(InMemoryTurnoRepository);
  });

  it("con sqlite usa el archivo de DATABASE_URL", () => {
    const { file, url } = urlTemporal();
    const repos = createRepos({ persistence: "sqlite", databaseUrl: url });
    cierres.push(repos.cerrar);
    expect(repos.turnos).toBeInstanceOf(SqliteTurnoRepository);
    expect(existsSync(file)).toBe(true);
  });

  it("el seed no duplica filas al arrancar dos veces", async () => {
    const { url } = urlTemporal();
    const a = createRepos({ persistence: "sqlite", databaseUrl: url });
    expect(await seedIfNeeded(a)).toBe(true);
    a.cerrar();
    const b = createRepos({ persistence: "sqlite", databaseUrl: url });
    cierres.push(b.cerrar);
    expect(await seedIfNeeded(b)).toBe(false);
    expect(await b.usuarios.listar()).toHaveLength(3);
    expect(await b.pacientes.listar()).toHaveLength(3);
  });

  it("el login con DEMO_PASSWORD funciona tras arrancar dos veces", async () => {
    const { url } = urlTemporal();
    const a = createRepos({ persistence: "sqlite", databaseUrl: url });
    await seedIfNeeded(a);
    a.cerrar();
    const b = createRepos({ persistence: "sqlite", databaseUrl: url });
    cierres.push(b.cerrar);
    await seedIfNeeded(b);
    const app = buildServer(b);
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "admin@demo.local", password: DEMO_PASSWORD },
    });
    await app.close();
    expect(res.statusCode).toBe(200);
  });
});