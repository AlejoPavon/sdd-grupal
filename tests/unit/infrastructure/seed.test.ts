import { beforeEach, describe, expect, it, vi } from "vitest";
import { InMemoryPacienteRepository } from "../../../src/infrastructure/persistence/in-memory-paciente-repository.js";
import { InMemoryPrestacionRepository } from "../../../src/infrastructure/persistence/in-memory-prestacion-repository.js";
import { InMemoryProfesionalRepository } from "../../../src/infrastructure/persistence/in-memory-profesional-repository.js";
import { InMemorySessionRepository } from "../../../src/infrastructure/persistence/in-memory-session-repository.js";
import { InMemorySillonRepository } from "../../../src/infrastructure/persistence/in-memory-sillon-repository.js";
import { InMemoryUsuarioRepository } from "../../../src/infrastructure/persistence/in-memory-usuario-repository.js";
import { verifyPassword } from "../../../src/application/auth/password.js";
import {
  cargarSeed,
  DEMO_PASSWORD,
  SEED_IDS,
  SUCURSAL_DEMO,
  type RepositoriosSeed,
} from "../../../src/infrastructure/seed.js";

function repositorios(): RepositoriosSeed {
  return {
    sillones: new InMemorySillonRepository(),
    profesionales: new InMemoryProfesionalRepository(),
    prestaciones: new InMemoryPrestacionRepository(),
    pacientes: new InMemoryPacienteRepository(),
    usuarios: new InMemoryUsuarioRepository(),
  };
}

describe("cargarSeed", () => {
  let repos: RepositoriosSeed;

  beforeEach(async () => {
    repos = repositorios();
    await cargarSeed(repos);
  });

  it("carga 2 sillones de la sucursal demo", async () => {
    const sillones = await repos.sillones.listar();
    expect(sillones).toHaveLength(2);
    expect(sillones.every((s) => s.sucursalId === SUCURSAL_DEMO.id)).toBe(true);
  });

  it("carga 2 profesionales con matrícula demo", async () => {
    const profesionales = await repos.profesionales.listar();
    expect(profesionales.map((p) => p.matricula).sort()).toEqual(["DEMO-001", "DEMO-002"]);
  });

  it("carga 4 prestaciones con la duración definida en la KB", async () => {
    const prestaciones = await repos.prestaciones.listar();
    const duraciones = Object.fromEntries(prestaciones.map((p) => [p.codigo, p.duracionMinutos]));
    expect(duraciones).toEqual({ CONSULTA: 30, LIMPIEZA: 45, ENDODONCIA: 90, CONTROL: 15 });
  });

  it("carga 3 pacientes ficticios", async () => {
    const pacientes = await repos.pacientes.listar();
    expect(pacientes).toHaveLength(3);
    expect(pacientes.every((p) => p.apellido.startsWith("Demo"))).toBe(true);
  });

  it("guarda un hash scrypt verificable en los tres usuarios demo", async () => {
    const usuarios = await repos.usuarios.listar();

    expect(usuarios.map((u) => u.rol).sort()).toEqual([
      "administrador",
      "profesional",
      "recepcionista",
    ]);
    for (const usuario of usuarios) {
      expect(usuario.passwordHash).toMatch(/^[A-Za-z0-9_-]{22}:[A-Za-z0-9_-]{86}$/);
      expect(usuario.passwordHash).not.toBe(DEMO_PASSWORD);
      await expect(verifyPassword(DEMO_PASSWORD, usuario.passwordHash)).resolves.toBe(true);
      await expect(verifyPassword("incorrecta", usuario.passwordHash)).resolves.toBe(false);
    }
  });

  it("usa el mismo hash para los tres usuarios (se calcula una sola vez)", async () => {
    const usuarios = await repos.usuarios.listar();

    expect(new Set(usuarios.map((u) => u.passwordHash)).size).toBe(1);
  });

  it("vincula odonto1 con el profesional demo", async () => {
    const odonto = await repos.usuarios.buscarPorId(SEED_IDS.odonto1);
    const admin = await repos.usuarios.buscarPorId(SEED_IDS.admin);

    expect(odonto?.profesionalId).toBe(SEED_IDS.profesional1);
    expect(admin?.profesionalId).toBeUndefined();
  });

  it("usa ids fijos y consultables", async () => {
    expect(await repos.sillones.buscarPorId(SEED_IDS.sillon2)).toBeDefined();
    expect((await repos.profesionales.buscarPorId(SEED_IDS.profesional1))?.matricula).toBe(
      "DEMO-001",
    );
  });

  it("usa solo emails de dominio .local", async () => {
    const usuarios = await repos.usuarios.listar();
    expect(usuarios.every((u) => u.email.endsWith("@demo.local"))).toBe(true);
  });

  it("deja todos los recursos activos", async () => {
    const [sillones, profesionales, prestaciones, pacientes] = await Promise.all([
      repos.sillones.listar(),
      repos.profesionales.listar(),
      repos.prestaciones.listar(),
      repos.pacientes.listar(),
    ]);
    const todos = [...sillones, ...profesionales, ...prestaciones, ...pacientes];
    expect(todos.every((recurso) => recurso.activo)).toBe(true);
  });

  it("respeta un DEMO_PASSWORD personalizado desde el entorno", async () => {
    const anterior = process.env.DEMO_PASSWORD;
    try {
      process.env.DEMO_PASSWORD = "clave-de-prueba";
      vi.resetModules();
      const modulo = await import("../../../src/infrastructure/seed.js");
      const repositoriosLocales = repositorios();
      await modulo.cargarSeed(repositoriosLocales);

      const usuario = await repositoriosLocales.usuarios.buscarPorId(SEED_IDS.admin);
      expect(modulo.DEMO_PASSWORD).toBe("clave-de-prueba");
      await expect(verifyPassword("clave-de-prueba", usuario!.passwordHash)).resolves.toBe(true);
      await expect(verifyPassword(DEMO_PASSWORD, usuario!.passwordHash)).resolves.toBe(false);
    } finally {
      if (anterior === undefined) delete process.env.DEMO_PASSWORD;
      else process.env.DEMO_PASSWORD = anterior;
      vi.resetModules();
    }
  });

  it("cargar el seed dos veces emite hashes distintos y sesiones independientes", async () => {
    const segundo = repositorios();
    await cargarSeed(segundo);

    const primero = await repos.usuarios.buscarPorId(SEED_IDS.admin);
    const segundoAdmin = await segundo.usuarios.buscarPorId(SEED_IDS.admin);
    expect(primero!.passwordHash).not.toBe(segundoAdmin!.passwordHash);

    const sesiones = new InMemorySessionRepository();
    const s1 = await sesiones.crear(primero!.id, 60_000);
    const s2 = await sesiones.crear(segundoAdmin!.id, 60_000);
    expect(s1.token).not.toBe(s2.token);
  });
});
