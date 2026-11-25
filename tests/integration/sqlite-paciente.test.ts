import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { crearConexion } from "../../src/infrastructure/persistence/sqlite/connection";
import { runMigrations } from "../../src/infrastructure/persistence/sqlite/migrations";
import { SqlitePacienteRepository } from "../../src/infrastructure/persistence/sqlite/sqlite-paciente-repository";
import { PacienteDuplicadoError } from "../../src/domain/paciente/paciente.errors";

describe("sqlite paciente repository", () => {
  let dir: string;
  let db: Database.Database | null = null;
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

  it("duplicado de email entre activos", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "pac-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    const repo = new SqlitePacienteRepository(db);
    const now = new Date();
    await repo.crear({ id: "p1", nombre: "A", apellido: "B", email: "a@paciente.local", activo: true, createdAt: now, updatedAt: now });
    await expect(repo.crear({ id: "p2", nombre: "C", apellido: "D", email: "a@paciente.local", activo: true, createdAt: now, updatedAt: now })).rejects.toMatchObject({ campo: "email" });
  });

  it("duplicado de documento entre activos", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "pac-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    const repo = new SqlitePacienteRepository(db);
    const now = new Date();
    await repo.crear({ id: "p1", nombre: "A", apellido: "B", documento: "00000001", activo: true, createdAt: now, updatedAt: now });
    await expect(repo.crear({ id: "p2", nombre: "C", apellido: "D", documento: "00000001", activo: true, createdAt: now, updatedAt: now })).rejects.toMatchObject({ campo: "documento" });
  });

  it("reactivar con email de otro activo", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "pac-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    const repo = new SqlitePacienteRepository(db);
    const now = new Date();
    await repo.crear({ id: "p1", nombre: "A", apellido: "B", email: "a@paciente.local", activo: true, createdAt: now, updatedAt: now });
    await repo.crear({ id: "p2", nombre: "C", apellido: "D", email: "b@paciente.local", activo: false, createdAt: now, updatedAt: now });
    const p2 = await repo.buscarPorId("p2");
    await expect(repo.actualizar({ ...p2!, email: "a@paciente.local", activo: true, updatedAt: new Date() })).rejects.toBeInstanceOf(PacienteDuplicadoError);
  });

  it("reutilizar email de inactivo", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "pac-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    const repo = new SqlitePacienteRepository(db);
    const now = new Date();
    await repo.crear({ id: "p1", nombre: "A", apellido: "B", email: "a@paciente.local", activo: false, createdAt: now, updatedAt: now });
    await expect(repo.crear({ id: "p2", nombre: "C", apellido: "D", email: "a@paciente.local", activo: true, createdAt: now, updatedAt: now })).resolves.toBeTruthy();
  });

  it("ida y vuelta de fechaNacimiento", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "pac-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    const repo = new SqlitePacienteRepository(db);
    const now = new Date();
    const fn = new Date("1990-05-10T00:00:00.000Z");
    await repo.crear({ id: "p1", nombre: "A", apellido: "B", fechaNacimiento: fn, activo: true, createdAt: now, updatedAt: now });
    const found = await repo.buscarPorId("p1");
    expect(found?.fechaNacimiento).toEqual(fn);
  });
});
