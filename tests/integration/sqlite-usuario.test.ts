import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { crearConexion } from "../../src/infrastructure/persistence/sqlite/connection";
import { runMigrations } from "../../src/infrastructure/persistence/sqlite/migrations";
import { SqliteUsuarioRepository } from "../../src/infrastructure/persistence/sqlite/sqlite-usuario-repository";

describe("sqlite usuario repository", () => {
  let dir: string;
  let db: any;
  afterEach(() => {
    if (db) db.close();
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it("crea y busca por email con hash intacto", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "usr-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    const repo = new SqliteUsuarioRepository(db);
    const u = { id: "u1", email: "A@X.com ", passwordHash: "hash123", nombre: "Ana", apellido: "Paz", rol: "administrador" as const, activo: true };
    await repo.crear(u);
    const found = await repo.buscarPorEmail(" a@x.com");
    expect(found).toBeDefined();
    expect(found!.passwordHash).toBe("hash123");
  });
});
