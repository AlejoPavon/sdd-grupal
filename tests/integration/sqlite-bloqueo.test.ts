import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { crearConexion } from "../../src/infrastructure/persistence/sqlite/connection";
import { runMigrations } from "../../src/infrastructure/persistence/sqlite/migrations";
import { SqliteBloqueoRepository } from "../../src/infrastructure/persistence/sqlite/sqlite-bloqueo-repository";
import { Intervalo } from "../../src/domain/turno/intervalo";

describe("sqlite bloqueo repository", () => {
  let dir: string;
  let db: any;
  afterEach(() => {
    if (db) db.close();
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it("solapamiento semiabierto y eliminacion", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "blk-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    const repo = new SqliteBloqueoRepository(db);
    db.prepare("INSERT INTO profesional(id, nombre, apellido, matricula, especialidades, activo) VALUES (?,?,?,?,?,?)").run("p1","P","P","M", "[]", 1);
    const b = {
      id: "b1",
      profesionalId: "p1",
      inicio: new Date("2026-01-01T09:00:00Z"),
      fin: new Date("2026-01-01T09:30:00Z"),
      motivo: "x",
      creadoPor: "u1",
      createdAt: new Date(),
    };
    await repo.crear(b);
    const sol = await repo.buscarSolapadoPorProfesional(
      "p1",
      new Intervalo(new Date("2026-01-01T09:15:00Z"), new Date("2026-01-01T09:45:00Z"))
    );
    expect(sol.length).toBe(1);
    await repo.eliminar("b1");
    const sol2 = await repo.buscarSolapadoPorProfesional(
      "p1",
      new Intervalo(new Date("2026-01-01T09:15:00Z"), new Date("2026-01-01T09:45:00Z"))
    );
    expect(sol2.length).toBe(0);
  });
});
