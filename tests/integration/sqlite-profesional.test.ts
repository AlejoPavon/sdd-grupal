import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { crearConexion } from "../../src/infrastructure/persistence/sqlite/connection";
import { runMigrations } from "../../src/infrastructure/persistence/sqlite/migrations";
import { SqliteProfesionalRepository } from "../../src/infrastructure/persistence/sqlite/sqlite-profesional-repository";

describe("sqlite profesional repository", () => {
  let dir: string;
  let db: Database.Database | null = null;
  afterEach(() => {
    if (db) db.close();
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it("crea y lee igual con especialidades", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "prof-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    const repo = new SqliteProfesionalRepository(db);
    const p = { id: "p1", nombre: "Ana", apellido: "Paz", matricula: "M1", especialidades: ["ortodoncia", "endodoncia"], activo: true };
    await repo.crear(p);
    const found = await repo.buscarPorId("p1");
    expect(found).toEqual(p);
  });
});
