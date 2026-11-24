import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { crearConexion } from "../../src/infrastructure/persistence/sqlite/connection";
import { runMigrations } from "../../src/infrastructure/persistence/sqlite/migrations";
import { SqliteSillonRepository } from "../../src/infrastructure/persistence/sqlite/sqlite-sillon-repository";

describe("sqlite sillon repository", () => {
  let dir: string;
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it("crea y lee igual", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "sillon-"));
    const db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    const repo = new SqliteSillonRepository(db);
    const s = { id: "s1", nombre: "S1", sucursalId: "suc1", activo: true };
    await repo.crear(s);
    const found = await repo.buscarPorId("s1");
    expect(found).toEqual(s);
    db.close();
  });
});
