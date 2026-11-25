import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { crearConexion } from "../../src/infrastructure/persistence/sqlite/connection";
import { runMigrations } from "../../src/infrastructure/persistence/sqlite/migrations";
import { SqlitePrestacionRepository } from "../../src/infrastructure/persistence/sqlite/sqlite-prestacion-repository";

describe("sqlite prestacion repository", () => {
  let dir: string;
  let db: Database.Database | null = null;
  afterEach(() => {
    if (db) db.close();
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it("crea y lee igual", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "prest-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    const repo = new SqlitePrestacionRepository(db);
    const p = { id: "pr1", codigo: "CONS", nombre: "Consulta", duracionMinutos: 30, precio: 1000, activo: true };
    await repo.crear(p);
    const found = await repo.buscarPorId("pr1");
    expect(found).toEqual(p);
  });
});
