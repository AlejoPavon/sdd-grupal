import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { crearConexion } from "../../src/infrastructure/persistence/sqlite/connection";
import { runMigrations } from "../../src/infrastructure/persistence/sqlite/migrations";
import { SqlitePacienteRepository } from "../../src/infrastructure/persistence/sqlite/sqlite-paciente-repository";

describe("sqlite paciente repository", () => {
  let dir: string;
  let db: any;
  afterEach(() => {
    if (db) db.close();
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it("crea y lee igual", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "pac-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    const repo = new SqlitePacienteRepository(db);
    const now = new Date();
    const p = { id: "pa1", nombre: "Ana", apellido: "Paz", email: "a@paciente.local", documento: "00000001", activo: true, createdAt: now, updatedAt: now };
    await repo.crear(p);
    const found = await repo.buscarPorId("pa1");
    expect(found).toEqual(p);
  });

  it("actualizar inexistente lanza", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "pac-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    const repo = new SqlitePacienteRepository(db);
    const now = new Date();
    await expect(repo.actualizar({ id: "nope", nombre: "x", apellido: "y", activo: true, createdAt: now, updatedAt: now })).rejects.toBeTruthy();
  });
});
