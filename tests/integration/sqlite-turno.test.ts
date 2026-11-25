import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { crearConexion } from "../../src/infrastructure/persistence/sqlite/connection";
import { runMigrations } from "../../src/infrastructure/persistence/sqlite/migrations";
import { SqliteTurnoRepository } from "../../src/infrastructure/persistence/sqlite/sqlite-turno-repository";
import { Intervalo } from "../../src/domain/turno/intervalo";
import type { EstadoTurno } from "../../src/domain/turno/estado-turno";

function seed(db: Database.Database) {
  db.prepare("INSERT INTO profesional(id,nombre,apellido,matricula,especialidades,activo) VALUES (?,?,?,?,?,?)").run("prof1","P","P","M","[]",1);
  db.prepare("INSERT INTO sillon(id,nombre,sucursal_id,activo) VALUES (?,?,?,?)").run("sil1","S","suc",1);
  db.prepare("INSERT INTO prestacion(id,codigo,nombre,duracion_minutos,activo) VALUES (?,?,?,?,?)").run("pre1","C","Consulta",30,1);
  db.prepare("INSERT INTO paciente(id,nombre,apellido,activo,created_at,updated_at) VALUES (?,?,?,?,?,?)").run("pac1","A","B",1,Date.now(),Date.now());
}

describe("sqlite turno repository", () => {
  let dir: string;
  let db: Database.Database | null = null;
  afterEach(() => {
    if (db) db.close();
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it("crea y lee en nueva conexion", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "turno-"));
    const file = path.join(dir, "t.db");
    db = crearConexion(`file:${file}`);
    runMigrations(db);
    seed(db);
    const repo = new SqliteTurnoRepository(db);
    const now = new Date();
    const t = { id:"t1", pacienteId:"pac1", profesionalId:"prof1", sillonId:"sil1", prestacionId:"pre1", inicio:new Date("2026-01-01T09:00:00Z"), fin:new Date("2026-01-01T09:30:00Z"), estado:"pendiente" as EstadoTurno, esSobreturno:false, notas:"n", createdBy:"u1", autorizadoPor:"u2", createdAt:now, updatedAt:now };
    await repo.crear(t);
    db.close();
    const db2 = crearConexion(`file:${file}`);
    runMigrations(db2);
    const repo2 = new SqliteTurnoRepository(db2);
    const found = await repo2.buscarPorId("t1");
    expect(found?.inicio).toEqual(new Date("2026-01-01T09:00:00Z"));
    expect(found?.fin).toEqual(new Date("2026-01-01T09:30:00Z"));
    expect(found?.esSobreturno).toBe(false);
    expect(found?.notas).toBe("n");
    expect(found?.autorizadoPor).toBe("u2");
    db2.close();
    db = null;
  });

  it("solapamiento profesional lanza", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "turno-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    seed(db);
    const repo = new SqliteTurnoRepository(db);
    const now = new Date();
    const t1 = { id:"t1", pacienteId:"pac1", profesionalId:"prof1", sillonId:"sil1", prestacionId:"pre1", inicio:new Date("2026-01-01T09:00:00Z"), fin:new Date("2026-01-01T09:30:00Z"), estado:"pendiente" as EstadoTurno, esSobreturno:false, createdBy:"u1", createdAt:now, updatedAt:now };
    await repo.crear(t1);
    const t2 = { ...t1, id:"t2", inicio:new Date("2026-01-01T09:15:00Z"), fin:new Date("2026-01-01T09:45:00Z"), sillonId:"sil1" };
    await expect(repo.crear(t2)).rejects.toMatchObject({ code: "TURNO_SOLAPADO_PROFESIONAL" });
  });

  it("sobreturno en sillon ocupado lanza por sillon", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "turno-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    seed(db);
    const repo = new SqliteTurnoRepository(db);
    const now = new Date();
    const t1 = { id:"t1", pacienteId:"pac1", profesionalId:"prof1", sillonId:"sil1", prestacionId:"pre1", inicio:new Date("2026-01-01T09:00:00Z"), fin:new Date("2026-01-01T09:30:00Z"), estado:"pendiente" as EstadoTurno, esSobreturno:false, createdBy:"u1", createdAt:now, updatedAt:now };
    await repo.crear(t1);
    const t2 = { id:"t2", pacienteId:"pac1", profesionalId:"prof1", sillonId:"sil1", prestacionId:"pre1", inicio:new Date("2026-01-01T09:15:00Z"), fin:new Date("2026-01-01T09:45:00Z"), estado:"pendiente" as EstadoTurno, esSobreturno:true, autorizadoPor:"u1", createdBy:"u1", createdAt:now, updatedAt:now };
    await expect(repo.crear(t2)).rejects.toMatchObject({ code: "TURNO_SOLAPADO_SILLON" });
  });

  it("doble reserva con dos conexiones", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "turno-"));
    const file = path.join(dir, "t.db");
    db = crearConexion(`file:${file}`);
    runMigrations(db);
    seed(db);
    db.close();
    const db1 = crearConexion(`file:${file}`);
    const db2 = crearConexion(`file:${file}`);
    runMigrations(db1); runMigrations(db2);
    const r1 = new SqliteTurnoRepository(db1);
    const r2 = new SqliteTurnoRepository(db2);
    const now = new Date();
    const t = { id:"t1", pacienteId:"pac1", profesionalId:"prof1", sillonId:"sil1", prestacionId:"pre1", inicio:new Date("2026-01-01T09:00:00Z"), fin:new Date("2026-01-01T09:30:00Z"), estado:"pendiente" as EstadoTurno, esSobreturno:false, createdBy:"u1", createdAt:now, updatedAt:now };
    await r1.crear(t);
    const t2 = { ...t, id:"t2" };
    await expect(r2.crear(t2)).rejects.toMatchObject({ code: "TURNO_SOLAPADO_PROFESIONAL" });
    db1.close(); db2.close();
    db = null;
  });

  it("sobreturno del mismo profesional permitido", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "turno-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    seed(db);
    const repo = new SqliteTurnoRepository(db);
    const now = new Date();
    const t1 = { id: "t1", pacienteId: "pac1", profesionalId: "prof1", sillonId: "sil1", prestacionId: "pre1", inicio: new Date("2026-01-01T09:00:00Z"), fin: new Date("2026-01-01T09:30:00Z"), estado: "pendiente" as EstadoTurno, esSobreturno: false, createdBy: "u1", createdAt: now, updatedAt: now };
    await repo.crear(t1);
    const t2 = { id: "t2", pacienteId: "pac1", profesionalId: "prof1", sillonId: "sil1", prestacionId: "pre1", inicio: new Date("2026-01-01T09:15:00Z"), fin: new Date("2026-01-01T09:45:00Z"), estado: "pendiente" as EstadoTurno, esSobreturno: true, autorizadoPor: "u1", createdBy: "u1", createdAt: now, updatedAt: now };
    // sillón libre: usar otro sillón
    db.prepare("INSERT INTO sillon(id,nombre,sucursal_id,activo) VALUES (?,?,?,?)").run("sil2", "S2", "suc", 1);
    t2.sillonId = "sil2";
    const created = await repo.crear(t2);
    expect(created.esSobreturno).toBe(true);
    expect(created.autorizadoPor).toBe("u1");
  });

  it("turno contiguo permitido", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "turno-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    seed(db);
    const repo = new SqliteTurnoRepository(db);
    const now = new Date();
    const t1 = { id: "t1", pacienteId: "pac1", profesionalId: "prof1", sillonId: "sil1", prestacionId: "pre1", inicio: new Date("2026-01-01T09:00:00Z"), fin: new Date("2026-01-01T09:30:00Z"), estado: "pendiente" as EstadoTurno, esSobreturno: false, createdBy: "u1", createdAt: now, updatedAt: now };
    await repo.crear(t1);
    const t2 = { ...t1, id: "t2", inicio: new Date("2026-01-01T09:30:00Z"), fin: new Date("2026-01-01T10:00:00Z") };
    await expect(repo.crear(t2)).resolves.toBeTruthy();
  });

  it("turno cancelado no bloquea", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "turno-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    seed(db);
    const repo = new SqliteTurnoRepository(db);
    const now = new Date();
    const t1 = { id: "t1", pacienteId: "pac1", profesionalId: "prof1", sillonId: "sil1", prestacionId: "pre1", inicio: new Date("2026-01-01T09:00:00Z"), fin: new Date("2026-01-01T09:30:00Z"), estado: "pendiente" as EstadoTurno, esSobreturno: false, createdBy: "u1", createdAt: now, updatedAt: now };
    await repo.crear(t1);
    const cancelled = { ...t1, estado: "cancelado" as EstadoTurno, cancelledAt: new Date(), updatedAt: new Date() };
    await repo.actualizar(cancelled);
    const sol = await repo.buscarSolapadoPorProfesional("prof1", new Intervalo(new Date("2026-01-01T09:00:00Z"), new Date("2026-01-01T09:30:00Z")));
    expect(sol).toHaveLength(0);
    const t2 = { ...t1, id: "t2" };
    await expect(repo.crear(t2)).resolves.toBeTruthy();
  });

  it("cancelar persiste estado y cancelledAt", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "turno-"));
    const file = path.join(dir, "t.db");
    db = crearConexion(`file:${file}`);
    runMigrations(db);
    seed(db);
    const repo = new SqliteTurnoRepository(db);
    const now = new Date();
    const t1 = { id: "t1", pacienteId: "pac1", profesionalId: "prof1", sillonId: "sil1", prestacionId: "pre1", inicio: new Date("2026-01-01T09:00:00Z"), fin: new Date("2026-01-01T09:30:00Z"), estado: "pendiente" as EstadoTurno, esSobreturno: false, createdBy: "u1", createdAt: now, updatedAt: now };
    await repo.crear(t1);
    const cancelledAt = new Date("2026-01-01T10:00:00Z");
    await repo.actualizar({ ...t1, estado: "cancelado" as EstadoTurno, cancelledAt, updatedAt: new Date() });
    db.close();
    const db2 = crearConexion(`file:${file}`);
    runMigrations(db2);
    const repo2 = new SqliteTurnoRepository(db2);
    const found = await repo2.buscarPorId("t1");
    expect(found?.estado).toBe("cancelado");
    expect(found?.cancelledAt).toEqual(cancelledAt);
    db2.close();
    db = null;
  });

  it("buscarSolapado con excluirId", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "turno-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    seed(db);
    const repo = new SqliteTurnoRepository(db);
    const now = new Date();
    const t1 = { id: "t1", pacienteId: "pac1", profesionalId: "prof1", sillonId: "sil1", prestacionId: "pre1", inicio: new Date("2026-01-01T09:00:00Z"), fin: new Date("2026-01-01T09:30:00Z"), estado: "pendiente" as EstadoTurno, esSobreturno: false, createdBy: "u1", createdAt: now, updatedAt: now };
    await repo.crear(t1);
    const res = await repo.buscarSolapadoPorProfesional("prof1", new Intervalo(new Date("2026-01-01T09:00:00Z"), new Date("2026-01-01T09:30:00Z")), "t1");
    expect(res).toHaveLength(0);
  });

  it("listar con filtros desde hasta estados y orden", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "turno-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    seed(db);
    const repo = new SqliteTurnoRepository(db);
    const now = new Date();
    const t1 = { id: "t1", pacienteId: "pac1", profesionalId: "prof1", sillonId: "sil1", prestacionId: "pre1", inicio: new Date("2026-01-01T09:00:00Z"), fin: new Date("2026-01-01T09:30:00Z"), estado: "pendiente" as EstadoTurno, esSobreturno: false, createdBy: "u1", createdAt: now, updatedAt: now };
    const t2 = { id: "t2", pacienteId: "pac1", profesionalId: "prof1", sillonId: "sil1", prestacionId: "pre1", inicio: new Date("2026-01-01T10:00:00Z"), fin: new Date("2026-01-01T10:30:00Z"), estado: "confirmado" as EstadoTurno, esSobreturno: false, createdBy: "u1", createdAt: now, updatedAt: now };
    await repo.crear(t1);
    await repo.crear(t2);
    const res = await repo.listar({ desde: new Date("2026-01-01T09:15:00Z"), hasta: new Date("2026-01-01T10:15:00Z"), estados: ["pendiente", "confirmado"] });
    expect(res.map((t) => t.id)).toEqual(["t1", "t2"]);
  });

  it("actualizar inexistente lanza RecursoNoEncontradoError", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "turno-"));
    db = crearConexion(`file:${path.join(dir, "t.db")}`);
    runMigrations(db);
    seed(db);
    const repo = new SqliteTurnoRepository(db);
    const now = new Date();
    await expect(repo.actualizar({ id: "nope", pacienteId: "pac1", profesionalId: "prof1", sillonId: "sil1", prestacionId: "pre1", inicio: new Date(), fin: new Date(), estado: "pendiente" as EstadoTurno, esSobreturno: false, createdBy: "u1", createdAt: now, updatedAt: now })).rejects.toBeTruthy();
  });
});
