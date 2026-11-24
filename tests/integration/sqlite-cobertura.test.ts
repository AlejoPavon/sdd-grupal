import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Intervalo } from "../../src/domain/turno/intervalo";
import { createRepos } from "../../src/infrastructure/persistence/create-repos";
import { InMemoryTurnoRepository } from "../../src/infrastructure/persistence/in-memory-turno-repository";
import { crearConexion } from "../../src/infrastructure/persistence/sqlite/connection";
import { runMigrations } from "../../src/infrastructure/persistence/sqlite/migrations";
import { SqliteBloqueoRepository } from "../../src/infrastructure/persistence/sqlite/sqlite-bloqueo-repository";
import { SqlitePacienteRepository } from "../../src/infrastructure/persistence/sqlite/sqlite-paciente-repository";
import { SqliteProfesionalRepository } from "../../src/infrastructure/persistence/sqlite/sqlite-profesional-repository";
import { SqliteSillonRepository } from "../../src/infrastructure/persistence/sqlite/sqlite-sillon-repository";
import { SqliteUsuarioRepository } from "../../src/infrastructure/persistence/sqlite/sqlite-usuario-repository";

describe("cobertura de escenarios SQLite", () => {
  let dir: string | undefined;
  const cierres: Array<() => void> = [];

  afterEach(() => {
    while (cierres.length) cierres.pop()!();
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  });

  function abrir(file?: string) {
    if (!file) {
      dir = mkdtempSync(path.join(tmpdir(), "cobertura-"));
      file = path.join(dir, "t.db");
    }
    const db = crearConexion(`file:${file}`);
    runMigrations(db);
    cierres.push(() => db.close());
    return { db, file };
  }

  async function sembrar(db: any) {
    await new SqliteProfesionalRepository(db).crear({
      id: "prof1", nombre: "Ana", apellido: "Demo", matricula: "M1", especialidades: ["general"], activo: true,
    });
    await new SqliteSillonRepository(db).crear({ id: "sil1", nombre: "Sillon 1", sucursalId: "suc", activo: true });
  }

  const base = Date.UTC(2030, 0, 15, 9, 0, 0);
  const t = (min: number) => new Date(base + min * 60000);
  const fecha = new Date("2030-01-01T00:00:00.000Z");

  const paciente = (id: string, apellido: string, activo = true) => ({
    id, nombre: "Ana", apellido, activo, createdAt: fecha, updatedAt: fecha,
  });

  const bloqueo = (id: string, extra: Record<string, unknown>, desde: number, hasta: number) => ({
    id, inicio: t(desde), fin: t(hasta), motivo: "Capacitacion demo", creadoPor: "u1", createdAt: fecha, ...extra,
  });

  it("sin PERSISTENCE definido usa memoria", () => {
    const previo = process.env.PERSISTENCE;
    delete process.env.PERSISTENCE;
    try {
      expect(createRepos({}).turnos).toBeInstanceOf(InMemoryTurnoRepository);
    } finally {
      if (previo !== undefined) process.env.PERSISTENCE = previo;
    }
  });

  it("pacientes: listar devuelve solo activos con y sin q", async () => {
    const repo = new SqlitePacienteRepository(abrir().db);
    await repo.crear(paciente("p1", "Gomez"));
    await repo.crear(paciente("p2", "Perez"));
    await repo.crear(paciente("p3", "Oculto", false));
    expect((await repo.listar()).map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(await repo.listar("oc")).toEqual([]);
    expect((await repo.listar("PER")).map((p) => p.id)).toEqual(["p2"]);
  });

  it("pacientes: busqueda con tildes y mayusculas igual que memoria", async () => {
    const repo = new SqlitePacienteRepository(abrir().db);
    await repo.crear(paciente("p1", "Gómez"));
    expect((await repo.listar("GÓM")).map((p) => p.id)).toEqual(["p1"]);
    expect(await repo.listar("GOM")).toEqual([]);
  });

  it("usuarios: buscar por email sin distinguir mayusculas ni espacios, y profesionalId", async () => {
    const a = abrir();
    await sembrar(a.db);
    const repo = new SqliteUsuarioRepository(a.db);
    await repo.crear({ id: "u1", email: "admin@demo.local", passwordHash: "hash-demo", nombre: "Admin", apellido: "Demo", rol: "administrador", activo: true });
    await repo.crear({ id: "u2", email: "odonto@demo.local", passwordHash: "hash-2", nombre: "Ana", apellido: "Demo", rol: "profesional", activo: true, profesionalId: "prof1" });
    const encontrado = await repo.buscarPorEmail("  ADMIN@demo.local ");
    expect(encontrado?.id).toBe("u1");
    expect(encontrado?.passwordHash).toBe("hash-demo");
    expect(encontrado?.profesionalId).toBeUndefined();
    expect((await repo.buscarPorId("u2"))?.profesionalId).toBe("prof1");
  });

  it("bloqueos: bloqueo de profesional se guarda y se lee con conexion nueva", async () => {
    const a = abrir();
    await sembrar(a.db);
    const original = bloqueo("b1", { profesionalId: "prof1" }, 0, 30);
    await new SqliteBloqueoRepository(a.db).crear(original);
    const b = abrir(a.file);
    const leido = await new SqliteBloqueoRepository(b.db).buscarPorId("b1");
    expect(leido).toEqual(original);
    expect(leido?.sillonId).toBeUndefined();
  });

  it("bloqueos: cada consulta devuelve los de su recurso y el de ambos aparece en las dos", async () => {
    const a = abrir();
    await sembrar(a.db);
    const repo = new SqliteBloqueoRepository(a.db);
    await repo.crear(bloqueo("bs", { sillonId: "sil1" }, 0, 30));
    await repo.crear(bloqueo("bp", { profesionalId: "prof1", sillonId: "sil1" }, 0, 30));
    const intervalo = new Intervalo(t(15), t(45));
    expect((await repo.buscarSolapadoPorProfesional("prof1", intervalo)).map((x) => x.id)).toEqual(["bp"]);
    expect((await repo.buscarSolapadoPorSillon("sil1", intervalo)).map((x) => x.id).sort()).toEqual(["bp", "bs"]);
  });

  it("bloqueos: un bloqueo contiguo no solapa", async () => {
    const a = abrir();
    await sembrar(a.db);
    const repo = new SqliteBloqueoRepository(a.db);
    await repo.crear(bloqueo("b1", { profesionalId: "prof1" }, 0, 30));
    expect(await repo.buscarSolapadoPorProfesional("prof1", new Intervalo(t(30), t(60)))).toEqual([]);
  });

  it("bloqueos: listar con filtros y orden por inicio con desempate por creacion", async () => {
    const a = abrir();
    await sembrar(a.db);
    const repo = new SqliteBloqueoRepository(a.db);
    await repo.crear(bloqueo("b1", { profesionalId: "prof1" }, 60, 90));
    await repo.crear(bloqueo("b2", { sillonId: "sil1" }, 0, 30));
    await repo.crear(bloqueo("b3", { profesionalId: "prof1" }, 0, 30));
    const ids = async (f?: any) => (await repo.listar(f)).map((x) => x.id);
    expect(await ids()).toEqual(["b2", "b3", "b1"]);
    expect(await ids({ profesionalId: "prof1" })).toEqual(["b3", "b1"]);
    expect(await ids({ sillonId: "sil1" })).toEqual(["b2"]);
    expect(await ids({ desde: t(30) })).toEqual(["b1"]);
    expect(await ids({ hasta: t(30) })).toEqual(["b2", "b3"]);
  });

  it("bloqueos: eliminar un bloqueo y eliminar un id inexistente no falla", async () => {
    const a = abrir();
    await sembrar(a.db);
    const repo = new SqliteBloqueoRepository(a.db);
    await repo.crear(bloqueo("b1", { profesionalId: "prof1" }, 0, 30));
    await repo.eliminar("b1");
    expect(await repo.buscarPorId("b1")).toBeUndefined();
    expect(await repo.buscarSolapadoPorProfesional("prof1", new Intervalo(t(0), t(30)))).toEqual([]);
    await expect(repo.eliminar("no-existe")).resolves.toBeUndefined();
  });
});