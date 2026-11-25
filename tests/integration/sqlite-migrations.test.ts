import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { crearConexion } from "../../src/infrastructure/persistence/sqlite/connection";
import { runMigrations } from "../../src/infrastructure/persistence/sqlite/migrations";

describe("migraciones sqlite", () => {
  let dir: string;
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it("crea schema e idempotente", () => {
    dir = mkdtempSync(path.join(tmpdir(), "sql-"));
    const file = path.join(dir, "t.db");
    const url = `file:${file}`;
    const db1 = crearConexion(url);
    runMigrations(db1);
    const tables = (
      db1.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>
    ).map((r) => r.name);
    expect(tables).toContain("turno");
    expect(tables).toContain("paciente");
    runMigrations(db1);
    const count = db1.prepare("SELECT COUNT(*) as c FROM schema_migrations").get() as { c: number };
    expect(count.c).toBe(2);
    db1.close();
  });

  it("indices de agenda existen", () => {
    dir = mkdtempSync(path.join(tmpdir(), "sql-"));
    const file = path.join(dir, "t.db");
    const db = crearConexion(`file:${file}`);
    runMigrations(db);
    const idx = (
      db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all() as Array<{ name: string }>
    ).map((r) => r.name);
    expect(idx).toContain("idx_turno_profesional_rango");
    expect(idx).toContain("idx_paciente_email_activo");
    db.close();
  });
});
